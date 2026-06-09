import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

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


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
