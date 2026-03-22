class SchemaField {
    constructor(fieldDetails) {
        Object.assign(this, fieldDetails);
    }
}

const globalPayload = {
    email: new SchemaField({
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    }),

    password: new SchemaField({
        type: String,
        required: true,
        min: 6,
        max: 12,
    }),

    profile: new SchemaField({
        type: String,
    }),

    instituteName: new SchemaField({
        type: String,
        required: true,
    }),

    instituteId: new SchemaField({
        type: String,
        required: true,
    }),

    pointOfContact: new SchemaField({
        type: String,
        required: true,
    }),

    landline: new SchemaField({
        type: Number,
    }),

    mobileNumber: new SchemaField({
        type: Number,
        required: true,
    }),

    addressLineOne: new SchemaField({
        type: String,
        required: true,
    }),

    addressLineTwo: new SchemaField({
        type: String,
    }),

    area: new SchemaField({
        type: String,
    }),

    country: new SchemaField({
        type: String,
        required: true,
    }),

    state: new SchemaField({
        type: String,
        required: true,
    }),

    district: new SchemaField({
        type: String,
        required: true,
    }),

    pincode: new SchemaField({
        type: Number,
        required: true,
    }),

    no_of_branches: new SchemaField({
        type: Number,
    }),

    no_of_faculty: new SchemaField({
        type: Number,
    }),

    no_of_student: new SchemaField({
        type: Number,
    }),

    role: new SchemaField({
        type: String,
        required: true,
    }),

    space: new SchemaField({
        type: Number,
        default: 0,
    }),

    spaceType: new SchemaField({
        type: String,
        enum: ["GB", "TB"],
        default: "GB",
    }),

    vr: new SchemaField({
        type: Boolean,
        default: false,
    }),

    institute_id: new SchemaField({
        type: String
    }),
    Type: new SchemaField({
        type: String,
        default: "Institute",
    }),
    createdBy: new SchemaField({
        type: String,
        required: true
    }),
    active: new SchemaField({
        type: Boolean,
        default: true
    }),
    archive: new SchemaField({
        type: Boolean,
        default: false
    }),
    page: new SchemaField({
        type: Number,
        min: 1,
        default: 1
    }),
    limit: new SchemaField({
        type: Number,
        min: 1,
        max: 100,
        default: 10
    }),
    id: new SchemaField({
        type: String,
        match: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 
    }),
    
    date: new SchemaField({
        type: String,
        match: /^\d{4}-\d{2}-\d{2}$/,
    }),
};


function getFields(fields) {
    const result = {};
    fields.forEach((field) => {
        if (globalPayload[field]) {
            result[field] = { ...globalPayload[field] };
        }
    });
    return result;
}

module.exports = getFields;
