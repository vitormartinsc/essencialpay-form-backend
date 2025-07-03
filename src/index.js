"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var fs_1 = require("fs");
var path_1 = require("path");
var multer_1 = require("multer");
var dotenv_1 = require("dotenv");
var s3Upload_1 = require("./utils/s3Upload");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)({
    origin: ((_a = process.env.CORS_ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:8080'],
    credentials: true,
}));
app.use(express_1.default.json());
// Configuração do multer para upload de arquivos
var upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: function (req, file, cb) {
        // Aceitar apenas imagens e PDFs
        var allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    },
});
// Pasta para salvar os dados (depois você substitui pelo S3)
var dataDir = path_1.default.join(__dirname, '../data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Rota para salvar os dados do formulário
app.post('/api/users', function (req, res) {
    try {
        var userData = __assign(__assign({ id: Date.now().toString() }, req.body), { createdAt: new Date().toISOString() });
        // Salvar em arquivo JSON (depois você substitui pela integração com S3)
        var fileName = "user_".concat(userData.id, ".json");
        var filePath = path_1.default.join(dataDir, fileName);
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
app.get('/api/users', function (req, res) {
    try {
        var files = fs_1.default.readdirSync(dataDir).filter(function (file) { return file.endsWith('.json'); });
        var users = files.map(function (file) {
            var data = fs_1.default.readFileSync(path_1.default.join(dataDir, file), 'utf8');
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
app.get('/api/cep/:cep', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cep, cleanCep, response, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cep = req.params.cep;
                cleanCep = cep.replace(/\D/g, '');
                // Validação básica do CEP
                if (cleanCep.length !== 8) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'CEP deve ter 8 dígitos'
                        })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch("https://viacep.com.br/ws/".concat(cleanCep, "/json/"))];
            case 2:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 3:
                data = _a.sent();
                if (data.erro) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'CEP não encontrado'
                        })];
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
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('❌ Erro ao buscar CEP:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar CEP'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Health check
app.get('/health', function (req, res) {
    res.json({
        success: true,
        message: 'Backend funcionando!',
        timestamp: new Date().toISOString()
    });
});
// Rota de teste para upload de arquivos
app.post('/api/upload-test', upload.single('file'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var uploadResult, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Nenhum arquivo enviado'
                        })];
                }
                console.log('📁 Arquivo recebido:', req.file.originalname);
                console.log('📊 Tamanho:', req.file.size);
                console.log('🔧 Tipo:', req.file.mimetype);
                return [4 /*yield*/, (0, s3Upload_1.uploadFileToS3)(req.file.buffer, req.file.originalname, req.file.mimetype, 'test-uploads')];
            case 1:
                uploadResult = _a.sent();
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
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('❌ Erro na rota de upload:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Erro interno do servidor',
                    error: error_2 instanceof Error ? error_2.message : 'Erro desconhecido'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Rota para servir o arquivo HTML de teste
app.get('/test-upload.html', function (req, res) {
    var htmlPath = path_1.default.join(__dirname, '../test-upload.html');
    res.sendFile(htmlPath);
});
app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Servidor rodando na porta ".concat(PORT));
    console.log("\uD83D\uDCC1 Dados salvos em: ".concat(dataDir));
});
exports.default = app;
