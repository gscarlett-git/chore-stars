-- Chores App Database Schema

CREATE DATABASE IF NOT EXISTS choresapp;
USE choresapp;

-- Parents/Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('parent', 'admin') DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(50) DEFAULT 'star',
    color VARCHAR(20) DEFAULT '#FF6B6B',
    total_points INT DEFAULT 0,
    available_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chores table
CREATE TABLE IF NOT EXISTS chores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points INT DEFAULT 10,
    frequency ENUM('daily', 'weekly', 'monthly', 'specific_days') DEFAULT 'daily',
    days_of_week JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Chore completions table
CREATE TABLE IF NOT EXISTS chore_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chore_id INT NOT NULL,
    child_id INT NOT NULL,
    completed_date DATE NOT NULL,
    points_earned INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE KEY unique_completion (chore_id, child_id, completed_date)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points_cost INT DEFAULT 50,
    status ENUM('pending', 'approved', 'rejected', 'redeemed') DEFAULT 'pending',
    nominated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    redeemed_at TIMESTAMP NULL,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123 - should be changed!)
INSERT IGNORE INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$rBZzl3X.FHhGxJGDnCqrce0IQLZ0VNzNTpfhVRVRzXGVJMjv0vg7.', 'admin');
