import sharp from 'sharp';

export async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // Se não for uma imagem, retorna o buffer original
    if (!mimeType.startsWith('image/')) {
      return buffer;
    }

    // Configurações de compressão baseadas no tipo de imagem
    const sharpInstance = sharp(buffer);
    
    // Obter metadados da imagem
    const metadata = await sharpInstance.metadata();
    
    // Redimensionar se necessário (máximo 2048px)
    const maxDimension = 2048;
    if (metadata.width && metadata.height) {
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        sharpInstance.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Comprimir baseado no formato
    let compressedBuffer: Buffer;
    
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      compressedBuffer = await sharpInstance
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else if (mimeType === 'image/png') {
      compressedBuffer = await sharpInstance
        .png({ quality: 85, compressionLevel: 9 })
        .toBuffer();
    } else if (mimeType === 'image/webp') {
      compressedBuffer = await sharpInstance
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Para outros formatos, converte para JPEG
      compressedBuffer = await sharpInstance
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    }

    // Se o arquivo comprimido for maior que o original, retorna o original
    if (compressedBuffer.length >= buffer.length) {
      return buffer;
    }

    console.log(`✅ Imagem comprimida: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    // Em caso de erro, retorna o buffer original
    return buffer;
  }
}
