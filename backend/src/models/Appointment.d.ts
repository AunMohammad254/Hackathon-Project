import mongoose from 'mongoose';
declare const Appointment: mongoose.Model<{
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & Omit<{
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
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
        date: NativeDate;
        patientId: mongoose.Types.ObjectId;
        doctorId: mongoose.Types.ObjectId;
        status: "pending" | "confirmed" | "completed" | "cancelled";
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
        timestamps: true;
    }>> & Omit<{
        date: NativeDate;
        patientId: mongoose.Types.ObjectId;
        doctorId: mongoose.Types.ObjectId;
        status: "pending" | "confirmed" | "completed" | "cancelled";
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    date: NativeDate;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Appointment;
//# sourceMappingURL=Appointment.d.ts.map