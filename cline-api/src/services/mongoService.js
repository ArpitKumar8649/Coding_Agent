/**
 * MongoDB Service - Database connection and models for Advanced Cline API
 */

const { MongoClient, ObjectId } = require('mongodb');

class MongoService {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
        this.connectionString = process.env.MONGO_URL;
        this.dbName = process.env.DB_NAME || 'cline_advanced_api';
    }

    async connect() {
        if (this.isConnected) {
            return this.db;
        }

        try {
            console.log('🔌 Connecting to MongoDB...');
            this.client = new MongoClient(this.connectionString);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.isConnected = true;
            
            // Create indexes
            await this.createIndexes();
            
            console.log(`✅ Connected to MongoDB database: ${this.dbName}`);
            return this.db;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            // Sessions collection indexes
            await this.db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true });
            await this.db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour TTL
            
            // Context collection indexes
            await this.db.collection('contexts').createIndex({ sessionId: 1 });
            
            // Conversations collection indexes
            await this.db.collection('conversations').createIndex({ sessionId: 1 });
            await this.db.collection('conversations').createIndex({ timestamp: 1 });
            
            console.log('📋 Database indexes created successfully');
        } catch (error) {
            console.warn('⚠️  Index creation warning:', error.message);
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('🔌 MongoDB disconnected');
        }
    }

    // Session Management
    async createSession(sessionData) {
        const collection = this.db.collection('sessions');
        const session = {
            ...sessionData,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active'
        };
        
        const result = await collection.insertOne(session);
        return { ...session, _id: result.insertedId };
    }

    async getSession(sessionId) {
        const collection = this.db.collection('sessions');
        return await collection.findOne({ sessionId });
    }

    async updateSession(sessionId, updates) {
        const collection = this.db.collection('sessions');
        const result = await collection.updateOne(
            { sessionId },
            { 
                $set: { 
                    ...updates, 
                    updatedAt: new Date() 
                } 
            }
        );
        return result.modifiedCount > 0;
    }

    async getAllSessions() {
        const collection = this.db.collection('sessions');
        return await collection.find({}).sort({ createdAt: -1 }).toArray();
    }

    async deleteSession(sessionId) {
        const collection = this.db.collection('sessions');
        const result = await collection.deleteOne({ sessionId });
        return result.deletedCount > 0;
    }

    // Context Management
    async saveContext(sessionId, contextData) {
        const collection = this.db.collection('contexts');
        const context = {
            sessionId,
            ...contextData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await collection.replaceOne(
            { sessionId },
            context,
            { upsert: true }
        );
        
        return context;
    }

    async getContext(sessionId) {
        const collection = this.db.collection('contexts');
        return await collection.findOne({ sessionId });
    }

    // Conversation History
    async saveConversation(sessionId, conversationData) {
        const collection = this.db.collection('conversations');
        const conversation = {
            sessionId,
            ...conversationData,
            timestamp: new Date()
        };
        
        const result = await collection.insertOne(conversation);
        return { ...conversation, _id: result.insertedId };
    }

    async getConversationHistory(sessionId, limit = 50) {
        const collection = this.db.collection('conversations');
        return await collection
            .find({ sessionId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    // Tool Execution History
    async saveToolExecution(sessionId, executionData) {
        const collection = this.db.collection('tool_executions');
        const execution = {
            sessionId,
            ...executionData,
            timestamp: new Date()
        };
        
        const result = await collection.insertOne(execution);
        return { ...execution, _id: result.insertedId };
    }

    async getToolExecutionHistory(sessionId, limit = 100) {
        const collection = this.db.collection('tool_executions');
        return await collection
            .find({ sessionId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    // Validation Results
    async saveValidationResult(sessionId, validationData) {
        const collection = this.db.collection('validations');
        const validation = {
            sessionId,
            ...validationData,
            timestamp: new Date()
        };
        
        const result = await collection.insertOne(validation);
        return { ...validation, _id: result.insertedId };
    }

    // Git Operations
    async saveGitOperation(sessionId, gitData) {
        const collection = this.db.collection('git_operations');
        const gitOp = {
            sessionId,
            ...gitData,
            timestamp: new Date()
        };
        
        const result = await collection.insertOne(gitOp);
        return { ...gitOp, _id: result.insertedId };
    }

    // Statistics and Analytics
    async getSessionStats() {
        const sessionsCollection = this.db.collection('sessions');
        const conversationsCollection = this.db.collection('conversations');
        
        const [totalSessions, activeSessions, totalConversations] = await Promise.all([
            sessionsCollection.countDocuments({}),
            sessionsCollection.countDocuments({ status: 'active' }),
            conversationsCollection.countDocuments({})
        ]);
        
        return {
            totalSessions,
            activeSessions,
            totalConversations,
            timestamp: new Date()
        };
    }
}

// Singleton instance
const mongoService = new MongoService();

module.exports = mongoService;