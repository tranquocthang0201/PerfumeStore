IF DB_ID(N'PerfumeStoreDB') IS NULL
BEGIN
    CREATE DATABASE PerfumeStoreDB;
END
GO

USE PerfumeStoreDB;
GO

IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('ProductSizes', 'U') IS NOT NULL DROP TABLE ProductSizes;
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    address NVARCHAR(255),
    role NVARCHAR(20) DEFAULT 'user',
    createdAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) UNIQUE,
    name NVARCHAR(150) NOT NULL,
    image NVARCHAR(255),
    shortDesc NVARCHAR(255),
    type NVARCHAR(50),
    brand NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE ProductSizes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    productId INT NOT NULL,
    ml INT NOT NULL,
    price FLOAT NOT NULL,
    stock INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_ProductSizes_Products
    FOREIGN KEY (productId)
    REFERENCES Products(id)
    ON DELETE CASCADE
);
GO

CREATE TABLE Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT,
    customerName NVARCHAR(100),
    email NVARCHAR(100),
    phone NVARCHAR(20),
    address NVARCHAR(255),
    total FLOAT NOT NULL,
    status NVARCHAR(50) DEFAULT N'Chờ xác nhận',
    paymentMethod NVARCHAR(50),
    orderDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Orders_Users
    FOREIGN KEY (userId)
    REFERENCES Users(id)
);
GO

CREATE TABLE OrderItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT,
    productName NVARCHAR(150),
    ml INT,
    price FLOAT,
    quantity INT NOT NULL,

    CONSTRAINT FK_OrderItems_Orders
    FOREIGN KEY (orderId)
    REFERENCES Orders(id)
    ON DELETE CASCADE,

    CONSTRAINT FK_OrderItems_Products
    FOREIGN KEY (productId)
    REFERENCES Products(id)
);
GO

INSERT INTO Users (fullName, email, password, phone, address, role)
VALUES
(N'Admin', N'admin@perfume.vn', N'$2a$10$QWertYhKsJmJ5XK1d6fB6eP4ObqNml3nLUaRV8uELx4EY4uYj27Wm', N'0900000000', N'Perfume Store', N'admin');
GO

INSERT INTO Products (code, name, image, shortDesc, type, brand)
VALUES
(N'dior-1', N'Dior Sauvage Elixir', N'pic/diorsauvage.jpg', N'Hương thơm đậm đặc, nam tính.', N'nam', N'dior'),
(N'dior-2', N'Dior J’adore Eau de Parfum', N'pic/diorjadore.jpg', N'Nữ tính, hoa cỏ sang trọng.', N'nu', N'dior'),
(N'chanel-1', N'Bleu de Chanel', N'pic/chanelbleu.jpg', N'Hương gỗ thơm, nam tính, lịch lãm.', N'nam', N'chanel'),
(N'chanel-2', N'Chanel Coco Mademoiselle', N'pic/chanelcoco.jpg', N'Hương hoa cỏ Chypre, nữ tính.', N'nu', N'chanel'),
(N'gucci-1', N'Gucci Flora Gorgeous Gardenia', N'pic/gucci/gucci_1.jpg', N'Hương hoa quả ngọt ngào.', N'nu', N'gucci');
GO

INSERT INTO ProductSizes (productId, ml, price, stock)
VALUES
(1, 50, 3200000, 10),
(1, 75, 3700000, 5),
(1, 100, 4150000, 2),

(2, 50, 3100000, 20),
(2, 75, 3500000, 10),
(2, 100, 3900000, 5),

(3, 50, 2900000, 15),
(3, 75, 3400000, 10),
(3, 100, 3900000, 5),

(4, 50, 3200000, 12),
(4, 75, 3700000, 8),
(4, 100, 4100000, 4),

(5, 50, 2950000, 10),
(5, 100, 3800000, 5);
GO