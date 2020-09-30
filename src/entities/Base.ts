import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Base {
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @CreateDateColumn({ type: "timestamp", select: false })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", select: false })
  public readonly updatedAt!: Date;
}
