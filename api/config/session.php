<?php
// Starts the PHP session, stored in the php_sessions table instead of files.
// Needed on Vercel: each request can run on a fresh instance, so file sessions would be lost.
// Used by api/helpers.php and the client/admin*.php pages.
require_once __DIR__ . '/db.php';

// shortcut: no row locking, so two parallel requests that both change $_SESSION can overwrite each other;
// fine here (sessions only hold user_id + csrf), add SELECT ... FOR UPDATE if sessions grow.
class DbSessionHandler implements SessionHandlerInterface, SessionUpdateTimestampHandlerInterface
{
    private function cutoff(): int {
        return time() - (int) ini_get('session.gc_maxlifetime');
    }
    public function open(string $path, string $name): bool { return true; }
    public function close(): bool { return true; }

    public function read(string $id): string|false {
        $s = db()->prepare('SELECT data FROM php_sessions WHERE id = ? AND updated_at > ?');
        $s->execute([$id, $this->cutoff()]);
        return (string) ($s->fetchColumn() ?: '');
    }
    public function write(string $id, string $data): bool {
        db()->prepare('INSERT INTO php_sessions (id, data, updated_at) VALUES (?, ?, ?)
                       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at')
            ->execute([$id, $data, time()]);
        return true;
    }
    public function destroy(string $id): bool {
        db()->prepare('DELETE FROM php_sessions WHERE id = ?')->execute([$id]);
        return true;
    }
    public function gc(int $max_lifetime): int|false {
        $s = db()->prepare('DELETE FROM php_sessions WHERE updated_at < ?');
        $s->execute([time() - $max_lifetime]);
        return $s->rowCount();
    }
    // With session.use_strict_mode, PHP rejects session IDs the server never issued (blocks session fixation)
    public function validateId(string $id): bool {
        $s = db()->prepare('SELECT 1 FROM php_sessions WHERE id = ? AND updated_at > ?');
        $s->execute([$id, $this->cutoff()]);
        return (bool) $s->fetchColumn();
    }
    public function updateTimestamp(string $id, string $data): bool {
        db()->prepare('UPDATE php_sessions SET updated_at = ? WHERE id = ?')->execute([time(), $id]);
        return true;
    }
}

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    session_set_save_handler(new DbSessionHandler(), true);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,       // JS cannot read the session cookie
        'samesite' => 'Lax',
        // Vercel terminates HTTPS at its proxy, so PHP sees plain HTTP; trust the forwarded scheme
        'secure'   => !empty($_SERVER['HTTPS']) || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
    ]);
    session_start();
}
