import mongoose from 'mongoose';
declare const Patient: mongoose.Model<{
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & Omit<{
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        name: string;
        age: number;
        gender: "Male" | "Female" | "Other";
        contact: string;
        createdBy: mongoose.Types.ObjectId;
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
        timestamps: true;
    }>> & Omit<{
        name: string;
        age: number;
        gender: "Male" | "Female" | "Other";
        contact: string;
        createdBy: mongoose.Types.ObjectId;
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Patient;
//# sourceMappingURL=Patient.d.ts.map