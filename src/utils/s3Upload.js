"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToS3 = uploadFileToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_1 = require("../config/aws");
const uuid_1 = require("uuid");
function uploadFileToS3(fileBuffer_1, fileName_1, contentType_1) {
    return __awaiter(this, arguments, void 0, function* (fileBuffer, fileName, contentType, folder = 'documents') {
        try {
            // Gerar um nome único para o arquivo
            const fileExtension = fileName.split('.').pop();
            const uniqueFileName = `${folder}/${(0, uuid_1.v4)()}.${fileExtension}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: aws_1.BUCKET_NAME,
                Key: uniqueFileName,
                Body: fileBuffer,
                ContentType: contentType,
                ACL: 'private', // Arquivo privado por segurança
            });
            yield aws_1.s3Client.send(command);
            // URL do arquivo no S3
            const fileUrl = `https://${aws_1.BUCKET_NAME}.s3.${process.env.AWS_S3_REGION_NAME}.amazonaws.com/${uniqueFileName}`;
            return {
                success: true,
                url: fileUrl,
                key: uniqueFileName,
            };
        }
        catch (error) {
            console.error('Erro ao fazer upload para S3:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            };
        }
    });
}
