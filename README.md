
# Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run DB

```bash
docker compose up -d
```

## Env

Copy the [Env Example](./env.example) and make a .env file in root

## Applying seed:

```bash
npm run seed:parts
npm run seed:users
npm run seed:orders
```

## For database schema changes:

Update your schema.prisma file
Run npx prisma migrate dev --name your_migration_name locally
This creates a new migration file in migrations
Commit both the schema changes AND the new migration files
Push to GitHub
When deployed, entrypoint.sh will run migrate deploy to apply your changes

## Reset DB:

```bash
npx prisma migrate reset
```

## Import prod db into dev db:

```bash
sudo apt update
sudo apt install postgresql-client
```

```bash
sudo apt update
sudo apt install postgresql-client-17
```

Empty dev db:

```bash
docker exec revsticks_backend-timescaledb-1 \
psql -U cwx_dev -d postgres \
-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Import prod db into dev db:

```bash
cat prod_to_dev.dump | docker exec -i revsticks_backend-timescaledb-1 \
pg_restore -U cwx_dev -d postgres -v

```
# crestline-backend
