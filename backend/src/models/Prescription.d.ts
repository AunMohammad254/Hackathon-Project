import mongoose from 'mongoose';
declare const Prescription: mongoose.Model<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
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
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & Omit<{
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
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
        medicines: mongoose.Types.DocumentArray<{
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }, {}, {}> & {
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }>;
        instructions?: string | null;
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
        timestamps: true;
    }>> & Omit<{
        patientId: mongoose.Types.ObjectId;
        doctorId: mongoose.Types.ObjectId;
        medicines: mongoose.Types.DocumentArray<{
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }, {}, {}> & {
            name: string;
            dosage: string;
            duration: string;
            instructions?: string | null;
        }>;
        instructions?: string | null;
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
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    medicines: mongoose.Types.DocumentArray<{
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }, {}, {}> & {
        name: string;
        dosage: string;
        duration: string;
        instructions?: string | null;
    }>;
    instructions?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Prescription;
//# sourceMappingURL=Prescription.d.ts.map