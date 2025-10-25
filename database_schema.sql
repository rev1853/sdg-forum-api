-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `profile_picture` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `google_id` VARCHAR(191) NULL,
    `google_email` VARCHAR(191) NULL,
    `google_picture` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_google_id_key`(`google_id`),
    UNIQUE INDEX `User_google_email_key`(`google_email`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sdg_number` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_name_key`(`name`),
    INDEX `Category_sdg_number_idx`(`sdg_number`),
    INDEX `Category_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Thread` (
    `id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `parent_thread_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `tags` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `review_score` DOUBLE NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Thread_author_id_idx`(`author_id`),
    INDEX `Thread_parent_thread_id_idx`(`parent_thread_id`),
    INDEX `Thread_status_idx`(`status`),
    INDEX `Thread_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThreadCategory` (
    `thread_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,

    INDEX `ThreadCategory_category_id_idx`(`category_id`),
    PRIMARY KEY (`thread_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interaction` (
    `id` VARCHAR(191) NOT NULL,
    `thread_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('LIKE', 'REPOST') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Interaction_user_id_idx`(`user_id`),
    INDEX `Interaction_type_idx`(`type`),
    INDEX `Interaction_created_at_idx`(`created_at`),
    UNIQUE INDEX `Interaction_thread_id_user_id_type_key`(`thread_id`, `user_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `thread_id` VARCHAR(191) NOT NULL,
    `reporter_id` VARCHAR(191) NOT NULL,
    `reason_code` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Report_thread_id_idx`(`thread_id`),
    INDEX `Report_reporter_id_idx`(`reporter_id`),
    INDEX `Report_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_token_hash_key`(`token_hash`),
    INDEX `PasswordResetToken_user_id_idx`(`user_id`),
    INDEX `PasswordResetToken_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ChatGroup_owner_id_idx`(`owner_id`),
    INDEX `ChatGroup_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatGroupCategory` (
    `group_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,

    INDEX `ChatGroupCategory_category_id_idx`(`category_id`),
    PRIMARY KEY (`group_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatGroupMember` (
    `group_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,

    INDEX `ChatGroupMember_user_id_idx`(`user_id`),
    INDEX `ChatGroupMember_role_idx`(`role`),
    PRIMARY KEY (`group_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `reply_to_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_group_id_created_at_idx`(`group_id`, `created_at`),
    INDEX `ChatMessage_reply_to_id_idx`(`reply_to_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Thread` ADD CONSTRAINT `Thread_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Thread` ADD CONSTRAINT `Thread_parent_thread_id_fkey` FOREIGN KEY (`parent_thread_id`) REFERENCES `Thread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreadCategory` ADD CONSTRAINT `ThreadCategory_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `Thread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreadCategory` ADD CONSTRAINT `ThreadCategory_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interaction` ADD CONSTRAINT `Interaction_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `Thread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interaction` ADD CONSTRAINT `Interaction_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `Thread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatGroup` ADD CONSTRAINT `ChatGroup_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatGroupCategory` ADD CONSTRAINT `ChatGroupCategory_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `ChatGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatGroupCategory` ADD CONSTRAINT `ChatGroupCategory_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatGroupMember` ADD CONSTRAINT `ChatGroupMember_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `ChatGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatGroupMember` ADD CONSTRAINT `ChatGroupMember_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `ChatGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_reply_to_id_fkey` FOREIGN KEY (`reply_to_id`) REFERENCES `ChatMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

