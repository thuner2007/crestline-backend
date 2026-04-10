// src/migrations/UpdateUserOrderRelation.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserOrderRelation1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_a02baa56670d46c43d8d06ef80b"`,
    );

    // Create new foreign key with ON DELETE SET NULL
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_a02baa56670d46c43d8d06ef80b" 
       FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes if needed
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_a02baa56670d46c43d8d06ef80b"`,
    );

    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_a02baa56670d46c43d8d06ef80b" 
       FOREIGN KEY ("userId") REFERENCES "user"("id")`,
    );
  }
}
