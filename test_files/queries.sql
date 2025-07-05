-- SQL Example File
-- Database schema and sample queries

-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    slug VARCHAR(250) UNIQUE,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
);

-- Insert sample data
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('john_doe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLrl56ttfb.7vEe', 'John', 'Doe'),
('jane_smith', 'jane@example.com', '$2b$12$EXRkfkdmQn3cyJ8N.UNJyOr8VPGd6/1YJ8C3SvN9j7YfJ8w0sR7Fe', 'Jane', 'Smith'),
('bob_wilson', 'bob@example.com', '$2b$12$9YlJ8gF7HKjNmQ8P2wR3VeX1KqL5D6cS4bN8mQ9pR7jY3xV2eT8uW', 'Bob', 'Wilson');

INSERT INTO posts (user_id, title, content, slug, status, published_at) VALUES
(1, 'Getting Started with SQL', 'This is a comprehensive guide to SQL basics...', 'getting-started-with-sql', 'published', '2024-01-15 10:30:00'),
(1, 'Advanced Query Techniques', 'Learn advanced SQL query patterns and optimizations...', 'advanced-query-techniques', 'published', '2024-01-20 14:15:00'),
(2, 'Database Design Best Practices', 'A deep dive into database normalization and design...', 'database-design-best-practices', 'published', '2024-01-25 09:45:00'),
(3, 'Draft Post About Indexing', 'This post is still being written...', 'draft-post-indexing', 'draft', NULL);

-- Sample queries

-- 1. Get all published posts with author information
SELECT 
    p.id,
    p.title,
    p.slug,
    p.view_count,
    p.published_at,
    CONCAT(u.first_name, ' ', u.last_name) AS author_name,
    u.username AS author_username
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC
LIMIT 10;

-- 2. Get user statistics
SELECT 
    u.id,
    u.username,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    COUNT(p.id) AS total_posts,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS published_posts,
    SUM(p.view_count) AS total_views,
    MAX(p.published_at) AS latest_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, u.first_name, u.last_name
HAVING COUNT(p.id) > 0
ORDER BY total_views DESC;

-- 3. Get posts with comment counts
SELECT 
    p.id,
    p.title,
    p.slug,
    COUNT(c.id) AS comment_count,
    COUNT(CASE WHEN c.is_approved = TRUE THEN 1 END) AS approved_comments
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.slug
ORDER BY comment_count DESC;

-- 4. Complex query with subqueries and window functions
WITH post_stats AS (
    SELECT 
        p.id,
        p.title,
        p.user_id,
        p.view_count,
        p.published_at,
        ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.view_count DESC) as popularity_rank,
        AVG(p.view_count) OVER (PARTITION BY p.user_id) as avg_user_views
    FROM posts p
    WHERE p.status = 'published'
),
user_totals AS (
    SELECT 
        user_id,
        COUNT(*) as total_published_posts,
        SUM(view_count) as total_user_views
    FROM posts
    WHERE status = 'published'
    GROUP BY user_id
)
SELECT 
    ps.title,
    CONCAT(u.first_name, ' ', u.last_name) AS author,
    ps.view_count,
    ps.popularity_rank,
    ROUND(ps.avg_user_views, 2) as avg_user_views,
    ut.total_published_posts,
    ut.total_user_views,
    ROUND((ps.view_count * 100.0 / ut.total_user_views), 2) as percentage_of_user_views
FROM post_stats ps
JOIN users u ON ps.user_id = u.id
JOIN user_totals ut ON ps.user_id = ut.user_id
WHERE ps.popularity_rank <= 3
ORDER BY u.last_name, ps.popularity_rank;

-- 5. Update view counts (example of UPDATE with JOIN)
UPDATE posts p
SET 
    view_count = view_count + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE p.id IN (
    SELECT post_id 
    FROM comments 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    GROUP BY post_id
    HAVING COUNT(*) > 2
);

-- 6. Delete old draft posts
DELETE p FROM posts p
WHERE p.status = 'draft' 
  AND p.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND NOT EXISTS (
      SELECT 1 FROM comments c WHERE c.post_id = p.id
  );
