import express, { Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config'
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const app = express();

// ==========================================
// 📡 SSE — ブラウザへのリアルタイム通知
// ==========================================
// 接続中の全クライアントを保持する。リクエスト単位で res を保存し、
// 切断時に削除することでメモリリークを防ぐ。
const sseClients = new Set<Response>();

function broadcastEvent(event: string, data: Record<string, unknown>) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

// プライベートIPアドレス（ローカルネットワーク）からのリクエストのみ許可する。
// 10.x, 172.16-31.x, 192.168.x は RFC1918 のプライベートアドレス帯。
// ラボPCから直接開いた場合の origin: null（ファイル直接開き）も許可する。
const PRIVATE_IP_RE = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || PRIVATE_IP_RE.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: このオリジンからのアクセスは許可されていません'));
    }
  },
}));
app.use(express.json());


// 🌟 2. 保存先フォルダの準備（なければ自動で作る）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🌟 3. multerの設定（保存先とファイル名のルール）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイル（JPEG / PNG / GIF / WebP）のみアップロードできます'));
    }
  },
});

// ==========================================
// 📥 画像を受け取るAPI（アップロード口）
// ==========================================
// フロントエンドの FormData から 'image' というキーで送られてきたファイルを受け取る
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'ファイルサイズは5MB以下にしてください' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがありません' });
    }
    const imageUrl = `http://${req.headers.host?.split(':')[0] ?? 'localhost'}:3001/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
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

// SSE エンドポイント — クライアントはここに接続し続けてイベントを受け取る
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // 接続が切れたらクライアントリストから削除
  req.on('close', () => {
    sseClients.delete(res);
  });

  // 30秒ごとにハートビートを送り、プロキシによる接続タイムアウトを防ぐ
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);
  req.on('close', () => clearInterval(heartbeat));
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
    const { name, englishName, quantity, barcode_str, imageUrl, minThreshold, keywords, url, unitPerBox } = req.body;

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
        unitPerBox: unitPerBox || 1,
        histories: {
          create: {
            actionType: 'CREATE',
            amountChange: 0,
          }
        }
      }
    });

    res.json(newItem);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Item with that name already exists' });
    }
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
    const currentItem = await prisma.item.findUnique({ where: { id: itemId } });

    // 消費時に在庫がマイナスになる操作を弾く
    if (quantity_change < 0 && currentItem && currentItem.quantity + quantity_change < 0) {
      return res.status(400).json({ error: 'Insufficient stock', quantity: currentItem.quantity });
    }

    const newQty = (currentItem?.quantity ?? 0) + quantity_change;

    if (actionType === 'RESTOCK') {
      if (currentItem?.orderStatus === 'ORDERED') {
        // 発注済み → 入荷済みに自動遷移
        orderStatusUpdate = { orderStatus: 'ARRIVED' };
        historyEntries.push({ actionType: 'ARRIVED', amountChange: 0 });
      } else if (currentItem?.orderStatus === 'REQUESTED' && newQty > (currentItem?.minThreshold ?? 0)) {
        // 補充検討中で入荷後に閾値を超えた → 自動でNONEに戻す
        orderStatusUpdate = { orderStatus: 'NONE' };
        historyEntries.push({ actionType: 'NONE', amountChange: 0 });
      }
    }

    if (actionType === 'CONSUME') {
      if (currentItem?.orderStatus === 'NONE' && newQty <= (currentItem?.minThreshold ?? 0)) {
        // 通常状態で消費して閾値以下になった → 補充検討中に自動遷移
        orderStatusUpdate = { orderStatus: 'REQUESTED' };
        historyEntries.push({ actionType: 'REQUESTED', amountChange: 0 });
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

    // 使用後に在庫が閾値以下になったら通知
    if (actionType === 'CONSUME' && updatedItem.quantity <= updatedItem.minThreshold) {
      broadcastEvent('low_stock', {
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        minThreshold: updatedItem.minThreshold,
      });
    }
    // 入荷によって ARRIVED に遷移した場合に通知
    if (actionType === 'RESTOCK' && updatedItem.orderStatus === 'ARRIVED') {
      broadcastEvent('item_arrived', { name: updatedItem.name });
    }

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
    const { name, englishName, minThreshold, keywords, imageUrl, orderUrl, unitPerBox } = req.body;

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name }),
        ...(englishName !== undefined && { englishName }),
        ...(minThreshold !== undefined && { minThreshold }),
        ...(keywords !== undefined && { keywords }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(orderUrl !== undefined && { site_url: orderUrl }),
        ...(unitPerBox !== undefined && { unitPerBox }),
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
  const allowed = ['NONE', 'REQUESTED', 'ORDERED', 'ARRIVED'];

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
    });

    // 手動で ARRIVED に変更された場合に通知（入荷ページ以外からの操作）
    if (orderStatus === 'ARRIVED') {
      broadcastEvent('item_arrived', { name: updatedItem.name });
    }

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

    broadcastEvent('reagent_requested', {
      reagentName: request.reagent.name,
      requestedBy: request.requestedBy ?? '',
    });

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reagent request' });
  }
});

// 試薬リクエストのキャンセル（REQUESTED・ORDERED のみ削除可）
app.delete('/api/reagent_requests/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const target = await prisma.reagentRequest.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'Request not found' });
    if (target.status === 'ARRIVED') {
      return res.status(400).json({ error: 'ARRIVED のリクエストはキャンセルできません' });
    }
    await prisma.reagentRequest.delete({ where: { id } });
    res.json({ message: 'Cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel request' });
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

    if (status === 'ARRIVED') {
      broadcastEvent('reagent_arrived', { reagentName: updated.reagent.name });
    }

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
