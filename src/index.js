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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
const s3Upload_1 = require("./utils/s3Upload");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)({
    origin: ((_a = process.env.CORS_ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:8080'],
    credentials: true,
}));
app.use(express_1.default.json());
// Configuração do multer para upload de arquivos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Aceitar apenas imagens e PDFs
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    },
});
// Pasta para salvar os dados (depois você substitui pelo S3)
const dataDir = path_1.default.join(__dirname, '../data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Rota para salvar os dados do formulário
app.post('/api/users', (req, res) => {
    try {
        const userData = Object.assign(Object.assign({ id: Date.now().toString() }, req.body), { createdAt: new Date().toISOString() });
        // Salvar em arquivo JSON (depois você substitui pela integração com S3)
        const fileName = `user_${userData.id}.json`;
        const filePath = path_1.default.join(dataDir, fileName);
        fs_1.default.writeFileSync(filePath, JSON.stringify(userData, null, 2));
        console.log('✅ Dados salvos:', fileName);
        res.json({
            success: true,
            message: 'Dados salvos com sucesso!',
            data: userData
        });
    }
    catch (error) {
        console.error('❌ Erro ao salvar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao salvar os dados'
        });
    }
});
// Rota para listar usuários salvos
app.get('/api/users', (req, res) => {
    try {
        const files = fs_1.default.readdirSync(dataDir).filter(file => file.endsWith('.json'));
        const users = files.map(file => {
            const data = fs_1.default.readFileSync(path_1.default.join(dataDir, file), 'utf8');
            return JSON.parse(data);
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('❌ Erro ao listar:', error);
        res.json({
            success: true,
            data: []
        });
    }
});
// Rota para buscar CEP
app.get('/api/cep/:cep', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cep } = req.params;
    // Remove formatação do CEP (deixa só números)
    const cleanCep = cep.replace(/\D/g, '');
    // Validação básica do CEP
    if (cleanCep.length !== 8) {
        return res.status(400).json({
            success: false,
            message: 'CEP deve ter 8 dígitos'
        });
    }
    try {
        // Busca na API do ViaCEP
        const response = yield fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = yield response.json();
        if (data.erro) {
            return res.status(404).json({
                success: false,
                message: 'CEP não encontrado'
            });
        }
        res.json({
            success: true,
            data: {
                cep: data.cep,
                logradouro: data.logradouro,
                complemento: data.complemento,
                bairro: data.bairro,
                localidade: data.localidade,
                uf: data.uf,
                ibge: data.ibge,
                gia: data.gia,
                ddd: data.ddd,
                siafi: data.siafi
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar CEP'
        });
    }
}));
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend funcionando!',
        timestamp: new Date().toISOString()
    });
});
// Rota de teste para upload de arquivos
app.post('/api/upload-test', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }
        console.log('📁 Arquivo recebido:', req.file.originalname);
        console.log('📊 Tamanho:', req.file.size);
        console.log('🔧 Tipo:', req.file.mimetype);
        // Fazer upload para S3
        const uploadResult = yield (0, s3Upload_1.uploadFileToS3)(req.file.buffer, req.file.originalname, req.file.mimetype, 'test-uploads');
        if (uploadResult.success) {
            console.log('✅ Upload realizado com sucesso!');
            console.log('🔗 URL:', uploadResult.url);
            console.log('🔑 Key:', uploadResult.key);
            res.json({
                success: true,
                message: 'Arquivo enviado com sucesso para S3!',
                data: {
                    fileName: req.file.originalname,
                    url: uploadResult.url,
                    key: uploadResult.key,
                    size: req.file.size,
                    contentType: req.file.mimetype
                }
            });
        }
        else {
            console.error('❌ Erro no upload:', uploadResult.error);
            res.status(500).json({
                success: false,
                message: 'Erro ao fazer upload para S3',
                error: uploadResult.error
            });
        }
    }
    catch (error) {
        console.error('❌ Erro na rota de upload:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}));
// Rota para servir o arquivo HTML de teste
app.get('/test-upload.html', (req, res) => {
    const htmlPath = path_1.default.join(__dirname, '../test-upload.html');
    res.sendFile(htmlPath);
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Dados salvos em: ${dataDir}`);
});
exports.default = app;
