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
// 📥 4-1. 画像を受け取るAPI（アップロード口）
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
// 📤 4-2. 画像を配信する機能（静的ファイル配信設定）
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
    const { name, quantity, minThreshold, imageUrl } = req.body;

    const newItem = await prisma.item.create({
      data: {
        name: name,
        quantity: quantity || 0,
        minThreshold: minThreshold || 5,
        imageUrl: imageUrl || null,
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

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: { increment: quantity_change },

        histories: {
          create: {
            actionType: actionType || 'QUANTITY_UPDATE',
            amountChange: quantity_change,

          }
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


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
