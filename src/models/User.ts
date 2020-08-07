import { DataTypes, NOW, UUIDV4, Optional, Model } from "sequelize";
import { sequelize } from "../helper/database";

interface UserAttributes {
  id: string;
  name: string | null;
  email: string;
  password: string;
  isVerified: boolean;
  isVerifiedToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date;
  role: number;
  isActive: boolean;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "isVerified"
    | "isVerifiedToken"
    | "passwordResetToken"
    | "passwordResetExpires"
    | "role"
    | "isActive"
  > {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: string;
  public name!: string | null;
  public email!: string;
  public password!: string;
  public isVerified!: boolean;
  public isVerifiedToken!: string | null;
  public passwordResetToken!: string | null;
  public passwordResetExpires!: Date;
  public role!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(),
      allowNull: false,
      unique: false,
    },
    password: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isVerifiedToken: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(),
      defaultValue: null,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE(),
      defaultValue: NOW,
      allowNull: false,
    },
    role: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: "user",
    sequelize,
  }
);
