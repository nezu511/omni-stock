import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config'
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());


// 🌟 2. 保存先フォルダの準備（なければ自動で作る）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🌟 3. multerの設定（保存先とファイル名のルール）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 'uploads' フォルダに保存
  },
  filename: function (req, file, cb) {
    // ファイル名が衝突しないように、現在時刻のミリ秒（Time Stamp）を頭に付与
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ==========================================
// 📥 画像を受け取るAPI（アップロード口）
// ==========================================
// フロントエンドの FormData から 'image' というキーで送られてきたファイルを受け取る
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Failed to upload image' });
  }

  // 外部からアクセスするためのURLを生成してフロントエンドに返す
  const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  res.json({ imageUrl: imageUrl });
});

// ==========================================
// 📤 画像を配信する機能（静的ファイル配信設定）
// ==========================================
// '/uploads/ファイル名' というURLリクエストが来たら、
// バックエンドの実際の 'uploads' フォルダ内をそのままブラウザにマウントする許可設定
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//API エンドポイント


//動作確認用ルート
app.get('/', (req, res) => {
  res.send('Lab Inventory API is running');
});

//在庫一覧を取得するAPI
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { histories: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

//アイテムを追加
app.post('/api/items', async (req, res) => {
  try {
    const { name, englishName, quantity, barcode_str, imageUrl, minThreshold, keywords, url } = req.body;

    const newItem = await prisma.item.create({
      data: {
        name: name,
        englishName: englishName || null,
        quantity: quantity || 0,
        barcode: barcode_str || null,
        imageUrl: imageUrl || null,
        minThreshold: minThreshold || 5,
        keywords: keywords || null,
        site_url: url || null,
        orderStatus: "NONE",
        histories: {
          create: {
            actionType: 'CREATE',
            amountChange: 0,
          }
        }
      }
    });

    res.json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

//アイテム数を増減
app.post("/api/quantity_change", async (req, res) => {
  try {
    const { itemId, quantity_change, actionType } = req.body;

    const historyEntries: { actionType: string; amountChange: number }[] = [
      { actionType: actionType || 'QUANTITY_UPDATE', amountChange: quantity_change }
    ];

    // 入荷(RESTOCK)時、入荷前の orderStatus が 'ORDERED'（注文済み）の場合のみ
    // 'ARRIVED'（入荷済み）へ遷移させる。「注文していない物がたまたま増えただけ」を
    // ARRIVED 扱いしないための分岐。
    // 数量変更とステータス変更を1回の update にまとめることで、
    // 片方だけ反映された中途半端な状態（原子性の欠如）を防ぐ。
    let orderStatusUpdate = {};
    if (actionType === 'RESTOCK') {
      const currentItem = await prisma.item.findUnique({ where: { id: itemId } });
      if (currentItem?.orderStatus === 'ORDERED') {
        orderStatusUpdate = { orderStatus: 'ARRIVED' };
        historyEntries.push({ actionType: 'ARRIVED', amountChange: 0 });
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: { increment: quantity_change },
        ...orderStatusUpdate,

        histories: {
          create: historyEntries
        }
      },
      include: { histories: true }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update amount ' });
  }
});


//アイテム1件と履歴を取得
app.get('/api/items/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { histories: { orderBy: { timestamp: 'desc' } } }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // DBカラム名 site_url を、フロントの types.ts に合わせて orderUrl にリネームして返す
    const { site_url, ...rest } = item;
    res.json({ ...rest, orderUrl: site_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

//アイテムのメタデータ（名前・しきい値・キーワード・画像・購入URL）を部分更新
app.patch('/api/items/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { name, englishName, minThreshold, keywords, imageUrl, orderUrl } = req.body;

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name }),
        ...(englishName !== undefined && { englishName }),
        ...(minThreshold !== undefined && { minThreshold }),
        ...(keywords !== undefined && { keywords }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(orderUrl !== undefined && { site_url: orderUrl }),
      },
      include: { histories: { orderBy: { timestamp: 'desc' } } }
    });

    const { site_url, ...rest } = updatedItem;
    res.json({ ...rest, orderUrl: site_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.patch("/api/change_status", async (req, res) => {
  const { itemId, orderStatus } = req.body;
  const allowed = ['NONE', 'ORDERED', 'ARRIVED'];

  if (!allowed.includes(orderStatus)) {
    return res.status(400).json({ error: 'Invalid orderStatus' });
  }

  try {
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        orderStatus: orderStatus,
        histories: {
          create: {
            actionType: orderStatus,
            amountChange: 0,
          }
        }
      }
    })
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update orderStatus' });
  }

})

app.delete("/api/items/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);

    //imageUrlを取得
    const targetItem = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!targetItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.$transaction([
      prisma.history.deleteMany({ where: { itemId: itemId } }),
      prisma.item.delete({ where: { id: itemId } })
    ]);

    //画像の削除
    if (targetItem.imageUrl) {
      //URLからファイル名を取り出す
      const filename = targetItem.imageUrl.split('/').pop();

      if (filename) {
        const filePath = path.join(__dirname, 'uploads', filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted image file: ${filename}`);
        }
      }
    }

    res.json({ message: 'Item adn associated image deleted successfully' });

  } catch (error) {
    console.error('Delete error: ', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});




// ==========================================
// 🧪 試薬マスタ API
// ==========================================

// 全試薬マスタを発注リクエスト込みで取得
app.get('/api/reagents', async (req, res) => {
  try {
    const reagents = await prisma.reagent.findMany({
      include: { requests: { orderBy: { createdAt: 'desc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(reagents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reagents' });
  }
});

// 試薬マスタ新規登録（重複名は 400）
app.post('/api/reagents', async (req, res) => {
  try {
    const { name, englishName, site_url } = req.body;
    const reagent = await prisma.reagent.create({
      data: { name, englishName: englishName || null, site_url: site_url || null },
    });
    res.json(reagent);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Reagent with that name already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create reagent' });
  }
});

// ==========================================
// 🧪 試薬リクエスト API
// ==========================================

// 発注リクエスト作成（既存試薬を選んで新規リクエスト1件を生やす）
app.post('/api/reagent_requests', async (req, res) => {
  try {
    const { reagentId, requestedBy } = req.body;
    const request = await prisma.reagentRequest.create({
      data: { reagentId, requestedBy: requestedBy || null, status: 'REQUESTED' },
      include: { reagent: true },
    });
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reagent request' });
  }
});

// 状態遷移（許可リストで門番。数量操作なし、状態のみ更新）
app.patch('/api/reagent_requests/:id/status', async (req, res) => {
  const allowed = ['REQUESTED', 'ORDERED', 'ARRIVED'];
  const { status } = req.body;

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.reagentRequest.update({
      where: { id },
      data: { status },
      include: { reagent: true },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
