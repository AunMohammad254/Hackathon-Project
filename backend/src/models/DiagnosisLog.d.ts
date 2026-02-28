import mongoose from 'mongoose';
declare const DiagnosisLog: mongoose.Model<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & Omit<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
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
        patientId: mongoose.Types.ObjectId;
        doctorId: mongoose.Types.ObjectId;
        symptoms: string[];
        riskLevel: "Low" | "Medium" | "High";
        aiResponse?: any;
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
        timestamps: true;
    }>> & Omit<{
        patientId: mongoose.Types.ObjectId;
        doctorId: mongoose.Types.ObjectId;
        symptoms: string[];
        riskLevel: "Low" | "Medium" | "High";
        aiResponse?: any;
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    riskLevel: "Low" | "Medium" | "High";
    aiResponse?: any;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default DiagnosisLog;
//# sourceMappingURL=DiagnosisLog.d.ts.map