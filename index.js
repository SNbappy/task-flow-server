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
        console.log("✅ Connected to MongoDB!");

        const db = client.db("taskManager");
        const usersCollection = db.collection("users");
        const tasksCollection = db.collection("tasks");

        // ✅ User Verification or Addition
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

        // ✅ Add a New Task
        app.post("/tasks", async (req, res) => {
            const { title, status = "todo", userId } = req.body;
            if (!title || !userId) return res.status(400).json({ error: "Title and userId are required" });

            try {
                const newTask = { title, status, userId, createdAt: new Date() };
                const result = await tasksCollection.insertOne(newTask);
                res.json({ insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ error: "Failed to add task" });
            }
        });

        // ✅ Get All Tasks for a User
        app.get('/tasks', async (req, res) => {
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: "Missing userId" });

            try {
                const tasks = await tasksCollection.find({ userId }).toArray();
                res.json(tasks);
            } catch (error) {
                res.status(500).json({ error: "Failed to fetch tasks" });
            }
        });


        app.get("/tasks/:userId", async (req, res) => {
            const { userId } = req.params;

            try {
                const tasks = await tasksCollection.find({ userId }).toArray(); // ✅ Corrected line

                if (tasks.length === 0) {
                    return res.status(404).json({ message: "No tasks found for this user." });
                }

                res.json(tasks);
            } catch (error) {
                res.status(500).json({ error: "Failed to fetch tasks" });
            }
        });



        // ✅ Update Task Status
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

        // ✅ Delete a Task
        app.delete('/tasks/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 1) {
                    res.json({ message: "Task deleted successfully" });
                } else {
                    res.status(404).json({ error: "Task not found" });
                }
            } catch (error) {
                res.status(500).json({ error: "Failed to delete task" });
            }
        });

    } finally {
        // Keep the connection open
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`🚀 Server running on port: ${port}`);
});
