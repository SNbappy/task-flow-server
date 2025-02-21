const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cdpi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("taskManager");
        const tasksCollection = db.collection("tasks");

        app.post("/users", async (req, res) => {
            const { uid, email } = req.body;
            if (!uid || !email) return res.status(400).json({ error: "Missing user data" });

            try {
                const existingUser = await usersCollection.findOne({ uid });
                if (!existingUser) {
                    await usersCollection.insertOne({ uid, email });
                }
                res.json({ message: "User verified/added" });
            } catch (error) {
                res.status(500).json({ error: "Error handling user" });
            }
        });


        // Add a new task
        app.post("/tasks", async (req, res) => {
            const { title, status, userId } = req.body;
            if (!title || !userId) return res.status(400).json({ error: "Title and userId are required" });

            try {
                const newTask = { title, status, userId };
                const result = await tasksCollection.insertOne(newTask);
                res.json({ insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ error: "Failed to add task" });
            }
        });

        // Get all tasks for a user
        app.get('/tasks', async (req, res) => {
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: "Missing userId" });

            const tasks = await tasksCollection.find({ userId }).toArray();
            res.send(tasks);
        });

        // Update task status
        app.put('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) return res.status(400).json({ error: "Status is required" });

            try {
                const result = await tasksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status } }
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: "Failed to update task" });
            }
        });

    } finally {
        // Do not close client
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
