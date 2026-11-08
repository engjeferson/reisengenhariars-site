# Cap na VPS com dominio proprio

1. DNS: crie dois registros A (`cap.seudominio.com.br` e `s3.seudominio.com.br`) para o IP da VPS.
2. Na VPS (Docker + Compose instalados, portas 80/443 liberadas):
   ```bash
   git clone https://github.com/CapSoftware/Cap.git && cd Cap
   # copie para dentro de Cap/: docker-compose.yml (substituindo o original), Caddyfile, .env.example, setup.sh
   chmod +x setup.sh && ./setup.sh && nano .env     # ajuste dominios e e-mail
   docker compose up -d --build
   ```
3. Acesse `https://cap.seudominio.com.br`. Sem e-mail configurado, pegue o link de login: `docker compose logs cap-web`.
4. No app desktop: Settings > Cap Server URL = `https://cap.seudominio.com.br`.

Notas
- Segredos sao aleatorios e ficam so no `.env` (nao commitar). Guarde backup: perder `DATABASE_ENCRYPTION_KEY` torna dados criptografados irrecuperaveis.
- Backup: volumes `cap-mysql-data` e `cap-minio-data`.
- Console do MinIO so em 127.0.0.1:9001 (use tunel SSH).
- Atualizar: `git pull && docker compose pull && docker compose up -d --build`.
- Validar sintaxe: `docker compose --env-file .env.example config`.
