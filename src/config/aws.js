"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = exports.s3Client = void 0;
var client_s3_1 = require("@aws-sdk/client-s3");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_S3_REGION_NAME || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
exports.BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME || 'essencial-form-files';
