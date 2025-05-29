<?php
// AI NEON创意工坊 - 图片文件列表API
// 用于服务器环境下获取指定文件夹中的图片文件

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// 安全检查
function isSecurePath($path) {
    // 防止路径遍历攻击
    $realPath = realpath(__DIR__ . '/../' . $path);
    $baseDir = realpath(__DIR__ . '/../');
    
    return $realPath && strpos($realPath, $baseDir) === 0;
}

// 检查是否为图片文件
function isImageFile($filename) {
    $imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return in_array($extension, $imageExtensions);
}

try {
    // 获取文件夹参数
    $folder = $_GET['folder'] ?? '';
    
    if (empty($folder)) {
        throw new Exception('文件夹参数不能为空');
    }
    
    // 安全检查
    if (!isSecurePath($folder)) {
        throw new Exception('无效的文件夹路径');
    }
    
    $folderPath = __DIR__ . '/../' . $folder;
    
    // 检查文件夹是否存在
    if (!is_dir($folderPath)) {
        throw new Exception('文件夹不存在: ' . $folder);
    }
    
    // 扫描文件夹中的图片文件
    $files = [];
    $scanResult = scandir($folderPath);
    
    if ($scanResult === false) {
        throw new Exception('无法读取文件夹: ' . $folder);
    }
    
    foreach ($scanResult as $file) {
        // 跳过隐藏文件和目录
        if ($file === '.' || $file === '..' || strpos($file, '.') === 0) {
            continue;
        }
        
        $filePath = $folderPath . '/' . $file;
        
        // 只处理文件，跳过子目录
        if (is_file($filePath) && isImageFile($file)) {
            $files[] = $file;
        }
    }
    
    // 按文件名排序
    sort($files);
    
    // 返回结果
    echo json_encode([
        'success' => true,
        'folder' => $folder,
        'count' => count($files),
        'files' => $files
    ]);
    
} catch (Exception $e) {
    // 返回错误信息
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'folder' => $folder ?? 'unknown'
    ]);
}
?> 