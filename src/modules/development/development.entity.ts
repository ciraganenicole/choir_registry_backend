import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity('development_sectors')
export class DevelopmentSector {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
}
@Entity('development_subcategories')
@Unique(['sectorId', 'name'])
export class DevelopmentSubcategory {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() sectorId: number;
  @ManyToOne(() => DevelopmentSector, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sectorId' })
  sector: DevelopmentSector;
}
@Entity('development_specialties')
@Unique(['subcategoryId', 'normalizedName'])
export class DevelopmentSpecialty {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() normalizedName: string;
  @Column() subcategoryId: number;
  @ManyToOne(() => DevelopmentSubcategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory: DevelopmentSubcategory;
}
@Entity('development_profiles')
export class DevelopmentProfile {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) phone: string;
  @Column() fullName: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'varchar', nullable: true }) photoUrl: string | null;
  @ManyToMany(() => DevelopmentSpecialty)
  @JoinTable({
    name: 'development_profile_specialties',
    joinColumn: { name: 'profileId' },
    inverseJoinColumn: { name: 'specialtyId' },
  })
  specialties: DevelopmentSpecialty[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
