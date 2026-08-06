IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fullName NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20) NULL,
        address NVARCHAR(255) NULL,
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'user',
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NULL,
        CONSTRAINT CK_Users_Role CHECK (role IN (N'user', N'admin'))
    );
END
GO

IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(150) NOT NULL,
        image NVARCHAR(255) NULL,
        shortDesc NVARCHAR(255) NULL,
        type NVARCHAR(50) NOT NULL,
        brand NVARCHAR(50) NOT NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NULL
    );
END
GO

IF OBJECT_ID(N'dbo.ProductSizes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductSizes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        productId INT NOT NULL,
        ml INT NOT NULL,
        price DECIMAL(18,2) NOT NULL,
        stock INT NOT NULL CONSTRAINT DF_ProductSizes_Stock DEFAULT 0,
        CONSTRAINT FK_ProductSizes_Products FOREIGN KEY (productId)
            REFERENCES dbo.Products(id) ON DELETE CASCADE,
        CONSTRAINT UQ_ProductSizes_Product_Ml UNIQUE (productId, ml),
        CONSTRAINT CK_ProductSizes_Ml CHECK (ml > 0),
        CONSTRAINT CK_ProductSizes_Price CHECK (price > 0),
        CONSTRAINT CK_ProductSizes_Stock CHECK (stock >= 0)
    );
END
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        customerName NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        address NVARCHAR(255) NOT NULL,
        total DECIMAL(18,2) NOT NULL,
        status NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT N'Chờ xác nhận',
        paymentMethod NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_Payment DEFAULT N'COD',
        orderDate DATETIME2 NOT NULL CONSTRAINT DF_Orders_OrderDate DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NULL,
        CONSTRAINT FK_Orders_Users FOREIGN KEY (userId) REFERENCES dbo.Users(id),
        CONSTRAINT CK_Orders_Total CHECK (total >= 0),
        CONSTRAINT CK_Orders_Status CHECK (status IN (N'Chờ xác nhận', N'Đã xác nhận', N'Đang giao', N'Giao thành công', N'Đã hủy'))
    );
END
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        id INT IDENTITY(1,1) PRIMARY KEY,
        orderId INT NOT NULL,
        productId INT NOT NULL,
        productName NVARCHAR(150) NOT NULL,
        ml INT NOT NULL,
        price DECIMAL(18,2) NOT NULL,
        quantity INT NOT NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (orderId)
            REFERENCES dbo.Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (productId)
            REFERENCES dbo.Products(id),
        CONSTRAINT CK_OrderItems_Quantity CHECK (quantity > 0),
        CONSTRAINT CK_OrderItems_Price CHECK (price > 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_UserId' AND object_id = OBJECT_ID(N'dbo.Orders'))
    CREATE INDEX IX_Orders_UserId ON dbo.Orders(userId, orderDate DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_Brand_Type' AND object_id = OBJECT_ID(N'dbo.Products'))
    CREATE INDEX IX_Products_Brand_Type ON dbo.Products(brand, type);
GO

-- Nâng cấp an toàn cho database đã được tạo từ phiên bản cũ của đồ án.
IF COL_LENGTH(N'dbo.Users', N'updatedAt') IS NULL
    ALTER TABLE dbo.Users ADD updatedAt DATETIME2 NULL;
GO

IF COL_LENGTH(N'dbo.Products', N'updatedAt') IS NULL
    ALTER TABLE dbo.Products ADD updatedAt DATETIME2 NULL;
GO

IF COL_LENGTH(N'dbo.Orders', N'updatedAt') IS NULL
    ALTER TABLE dbo.Orders ADD updatedAt DATETIME2 NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.ProductSizes')
      AND name IN (N'UQ_ProductSizes_Product_Ml', N'UX_ProductSizes_Product_Ml')
)
    CREATE UNIQUE INDEX UX_ProductSizes_Product_Ml ON dbo.ProductSizes(productId, ml);
GO

IF OBJECT_ID(N'dbo.Brands', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Brands (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        logo NVARCHAR(MAX) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_Brands_CreatedAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NULL
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Brands_Name' AND object_id = OBJECT_ID(N'dbo.Brands')
)
    CREATE INDEX IX_Brands_Name ON dbo.Brands(name);
GO

-- Danh mục động để admin có thể thêm/sửa/xóa thay vì cố định Nam/Nữ/Unisex.
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NULL
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Categories_Name' AND object_id = OBJECT_ID(N'dbo.Categories')
)
    CREATE INDEX IX_Categories_Name ON dbo.Categories(name);
GO

-- Logo có thể là đường dẫn/URL hoặc ảnh Data URL được chọn từ máy admin.
IF COL_LENGTH(N'dbo.Brands', N'logo') IS NOT NULL
    ALTER TABLE dbo.Brands ALTER COLUMN logo NVARCHAR(MAX) NULL;
GO


-- Thuộc tính hiển thị ngoài trang chủ: giảm giá, hàng mới và nổi bật.
IF COL_LENGTH(N'dbo.Products', N'discount') IS NULL
    ALTER TABLE dbo.Products ADD discount INT NOT NULL CONSTRAINT DF_Products_Discount DEFAULT (0) WITH VALUES;
GO

IF COL_LENGTH(N'dbo.Products', N'isNew') IS NULL
    ALTER TABLE dbo.Products ADD isNew BIT NOT NULL CONSTRAINT DF_Products_IsNew DEFAULT (0) WITH VALUES;
GO

IF COL_LENGTH(N'dbo.Products', N'isFeatured') IS NULL
    ALTER TABLE dbo.Products ADD isFeatured BIT NOT NULL CONSTRAINT DF_Products_IsFeatured DEFAULT (0) WITH VALUES;
GO

IF OBJECT_ID(N'dbo.CK_Products_Discount', N'C') IS NULL
    ALTER TABLE dbo.Products ADD CONSTRAINT CK_Products_Discount CHECK (discount BETWEEN 0 AND 99);
GO
