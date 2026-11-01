-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 31, 2026 at 10:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `para_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `admin_id` int(10) UNSIGNED DEFAULT NULL,
  `admin_name` varchar(100) NOT NULL,
  `action` varchar(40) NOT NULL,
  `target` varchar(150) NOT NULL,
  `details` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `admin_id`, `admin_name`, `action`, `target`, `details`, `created_at`) VALUES
(1, 5, 'ezekielferrer', 'type_deactivate', 'Bus (Ordinary)', 'Transport type \"bus_ordinary\"', '2026-10-25 07:21:42'),
(2, 5, 'ezekielferrer', 'type_deactivate', 'Bus (Aircon)', 'Transport type \"bus_aircon\"', '2026-10-25 07:21:49'),
(3, 5, 'ezekielferrer', 'type_activate', 'Bus (Ordinary)', 'Transport type \"bus_ordinary\"', '2026-10-25 07:22:42'),
(4, 5, 'ezekielferrer', 'type_activate', 'Bus (Aircon)', 'Transport type \"bus_aircon\"', '2026-10-25 11:21:40'),
(5, 5, 'ezekielferrer', 'type_deactivate', 'Bus (Aircon)', 'Transport type \"bus_aircon\"', '2026-10-25 16:30:16'),
(6, 5, 'ezekielferrer', 'type_deactivate', 'Bus (Ordinary)', 'Transport type \"bus_ordinary\"', '2026-10-25 16:30:18'),
(7, 5, 'ezekielferrer', 'type_deactivate', 'Modern Jeepney', 'Transport type \"modern_jeepney\"', '2026-10-25 16:30:19'),
(8, 5, 'ezekielferrer', 'type_activate', 'Bus (Aircon)', 'Transport type \"bus_aircon\"', '2026-10-25 16:30:31'),
(9, 5, 'ezekielferrer', 'type_activate', 'Bus (Ordinary)', 'Transport type \"bus_ordinary\"', '2026-10-25 16:30:31'),
(10, 5, 'ezekielferrer', 'type_activate', 'Modern Jeepney', 'Transport type \"modern_jeepney\"', '2026-10-25 16:30:31'),
(11, 5, 'ezekielferrer', 'landmark_public_add', 'Bahay Ko', 'Category: other', '2026-10-25 16:32:48'),
(12, 5, 'ezekielferrer', 'landmark_public_delete', 'Bahay Ko', '', '2026-10-25 16:33:03'),
(13, 5, 'ezekielferrer', 'type_deactivate', 'PWD', 'Passenger type \"pwd\"', '2026-10-25 18:46:40'),
(14, 5, 'ezekielferrer', 'type_activate', 'PWD', 'Passenger type \"pwd\"', '2026-10-25 18:46:41'),
(15, 5, 'ezekielferrer', 'landmark_public_add', 'Bahay Ni Admin', 'Category: other', '2026-10-31 18:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `favorite_routes`
--

CREATE TABLE `favorite_routes` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `label` varchar(100) NOT NULL,
  `origin_name` varchar(200) NOT NULL,
  `origin_lat` decimal(9,6) NOT NULL,
  `origin_lng` decimal(9,6) NOT NULL,
  `dest_name` varchar(200) NOT NULL,
  `dest_lat` decimal(9,6) NOT NULL,
  `dest_lng` decimal(9,6) NOT NULL,
  `transport_code` varchar(30) NOT NULL,
  `passenger_code` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landmarks`
--

CREATE TABLE `landmarks` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('school','hospital','terminal','market','church','park','food','other') NOT NULL DEFAULT 'other',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `lat` decimal(9,6) NOT NULL,
  `lng` decimal(9,6) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `landmarks`
--

INSERT INTO `landmarks` (`id`, `user_id`, `name`, `category`, `description`, `is_public`, `lat`, `lng`, `created_at`) VALUES
(13, NULL, 'Bahay Ni Admin', 'other', 'ang kulit niyo talaga \'no', 1, 14.809322, 121.152463, '2026-10-31 18:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `passenger_types`
--

CREATE TABLE `passenger_types` (
  `code` varchar(20) NOT NULL,
  `label` varchar(40) NOT NULL,
  `discount_rate` decimal(3,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `passenger_types`
--

INSERT INTO `passenger_types` (`code`, `label`, `discount_rate`, `is_active`) VALUES
('pwd', 'PWD', 0.20, 1),
('regular', 'Regular', 0.00, 1),
('senior', 'Senior Citizen', 0.20, 1),
('student', 'Student', 0.20, 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_types`
--

CREATE TABLE `transport_types` (
  `code` varchar(30) NOT NULL,
  `label` varchar(60) NOT NULL,
  `base_fare` decimal(6,2) NOT NULL,
  `base_km` decimal(4,1) NOT NULL,
  `excess_per_km` decimal(6,2) NOT NULL,
  `avg_speed_kph` decimal(5,2) NOT NULL DEFAULT 20.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transport_types`
--

INSERT INTO `transport_types` (`code`, `label`, `base_fare`, `base_km`, `excess_per_km`, `avg_speed_kph`, `is_active`) VALUES
('bus_aircon', 'Bus (Aircon)', 15.00, 5.0, 2.65, 30.00, 1),
('bus_ordinary', 'Bus (Ordinary)', 13.00, 5.0, 2.20, 25.00, 1),
('modern_jeepney', 'Modern Jeepney', 14.00, 4.0, 2.35, 22.00, 1),
('traditional_jeepney', 'Traditional Jeepney', 13.00, 4.0, 1.80, 20.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `origin_name` varchar(200) NOT NULL,
  `origin_lat` decimal(9,6) NOT NULL,
  `origin_lng` decimal(9,6) NOT NULL,
  `dest_name` varchar(200) NOT NULL,
  `dest_lat` decimal(9,6) NOT NULL,
  `dest_lng` decimal(9,6) NOT NULL,
  `transport_code` varchar(30) NOT NULL,
  `passenger_code` varchar(20) NOT NULL,
  `distance_km` decimal(6,2) NOT NULL,
  `total_fare` decimal(7,2) NOT NULL,
  `duration_min` smallint(5) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `default_passenger` varchar(20) DEFAULT NULL,
  `default_transport` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `profile_picture`, `role`, `created_at`, `default_passenger`, `default_transport`) VALUES
(5, 'ezekielferrer', 'ezekielzaqueo19@gmail.com', '$2y$10$WR2OKeUODslQKAQlVS7tM.r.poIO0r2yYep/bvNC7b62qrmbUTtzu', NULL, 'admin', '2026-10-10 20:38:18', NULL, NULL),
(6, 'Mharvin Charlze G. Boneo', 'mharvinpogi@gmail.com', '$2y$10$Ooh9HNFbVZq7c2LDjVZ6duqFQkpdMkMJDFLZEUpA9NVbS6wIlIR/q', '', 'user', '2026-10-24 13:55:44', 'student', 'traditional_jeepney');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_admin` (`admin_id`),
  ADD KEY `idx_audit_date` (`created_at`);

--
-- Indexes for table `favorite_routes`
--
ALTER TABLE `favorite_routes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_fav_transport` (`transport_code`),
  ADD KEY `fk_fav_passenger` (`passenger_code`),
  ADD KEY `idx_fav_user` (`user_id`);

--
-- Indexes for table `landmarks`
--
ALTER TABLE `landmarks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_landmarks_user` (`user_id`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attempts` (`email`,`ip`,`attempted_at`);

--
-- Indexes for table `passenger_types`
--
ALTER TABLE `passenger_types`
  ADD PRIMARY KEY (`code`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_password_reset_user` (`user_id`);

--
-- Indexes for table `transport_types`
--
ALTER TABLE `transport_types`
  ADD PRIMARY KEY (`code`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_trips_transport` (`transport_code`),
  ADD KEY `fk_trips_passenger` (`passenger_code`),
  ADD KEY `idx_trips_user_date` (`user_id`,`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `favorite_routes`
--
ALTER TABLE `favorite_routes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `landmarks`
--
ALTER TABLE `landmarks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `favorite_routes`
--
ALTER TABLE `favorite_routes`
  ADD CONSTRAINT `fk_fav_passenger` FOREIGN KEY (`passenger_code`) REFERENCES `passenger_types` (`code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fav_transport` FOREIGN KEY (`transport_code`) REFERENCES `transport_types` (`code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `landmarks`
--
ALTER TABLE `landmarks`
  ADD CONSTRAINT `fk_landmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `fk_trips_passenger` FOREIGN KEY (`passenger_code`) REFERENCES `passenger_types` (`code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_trips_transport` FOREIGN KEY (`transport_code`) REFERENCES `transport_types` (`code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_trips_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
