import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()

  id: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
publicKey?: string | null;

@Column({ unique: true, nullable: true })
matricule: string;

@Column({ default: () => 'CURRENT_TIMESTAMP' })
created_at: string;

}
