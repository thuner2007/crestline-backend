import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Test {
  @PrimaryGeneratedColumn()
  id: number; // auto-increment

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('timestamptz')
  createdAt: Date;
}
