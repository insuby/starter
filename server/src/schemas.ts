import {
  BLANK_PLACES,
  BLANK_STATUSES,
  BLANK_TYPES,
  OPERATION_STATUSES,
  OPERATION_TYPES,
  ORG_LEVELS,
} from './domain.js';

// JSON-схемы маршрутов: валидация входа и описание ответов (OpenAPI/Swagger).
// additionalProperties: true на элементах ответа — чтобы сериализатор не отбрасывал поля.

const ownerSchema = {
  type: ['object', 'null'],
  additionalProperties: true,
  properties: { id: { type: 'string' }, full_name: { type: 'string' } },
};

const byTypeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    military_id: { type: 'integer' },
    certificate: { type: 'integer' },
    credential: { type: 'integer' },
  },
};

export const blankItemSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    number: { type: 'string' },
    type: { type: 'string', enum: [...BLANK_TYPES] },
    status: { type: 'string', enum: [...BLANK_STATUSES] },
    place: { type: 'string', enum: [...BLANK_PLACES] },
    location_label: { type: 'string' },
    vkmo_id: { type: 'string' },
    owner: ownerSchema,
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
};

export const operationItemSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    blank_id: { type: 'string' },
    blank_number: { type: ['string', 'null'] },
    type: { type: 'string', enum: [...OPERATION_TYPES] },
    status: { type: 'string', enum: [...OPERATION_STATUSES] },
    reason: { type: 'string' },
    from_location: { type: ['string', 'null'] },
    to_location: { type: ['string', 'null'] },
    owner: ownerSchema,
    operator: { type: 'object', additionalProperties: true },
    commissioner: { type: ['object', 'null'], additionalProperties: true },
    comment: { type: ['string', 'null'] },
    operator_comment: { type: ['string', 'null'] },
    old_blank_id: { type: ['string', 'null'] },
    new_blank_id: { type: ['string', 'null'] },
    created_at: { type: 'string' },
    approved_at: { type: ['string', 'null'] },
  },
};

export const pendingSignatureSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    blank_id: { type: 'string' },
    blank_number: { type: ['string', 'null'] },
    type: { type: 'string', enum: [...OPERATION_TYPES] },
    status: { type: 'string' },
    reason: { type: 'string' },
    requires_commissioner_signature: { type: 'boolean' },
    created_at: { type: 'string' },
  },
};

export const dashboardSummarySchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      vkmo_id: { type: 'string' },
      org_unit_id: { type: 'string' },
      date_from: { type: 'string' },
      date_to: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        scope: { type: 'object', additionalProperties: true },
        blanks: {
          type: 'object',
          additionalProperties: true,
          properties: {
            total: { type: 'integer' },
            in_circulation: { type: 'integer' },
            issued: { type: 'integer' },
            on_hold: { type: 'integer' },
            written_off: { type: 'integer' },
            by_type: byTypeSchema,
          },
        },
        operations_pending_signature: { type: 'integer' },
        generated_at: { type: 'string' },
      },
    },
  },
};

export const operationsChartSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      days: { type: 'integer', minimum: 1, maximum: 90, default: 7 },
      vkmo_id: { type: 'string' },
      org_unit_id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        period: { type: 'object', additionalProperties: true },
        vkmo_id: { type: ['string', 'null'] },
        series: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
    },
  },
};

export const distributionSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    required: ['parent_org_unit_id', 'level'],
    properties: {
      parent_org_unit_id: { type: 'string' },
      level: { type: 'string', enum: [...ORG_LEVELS] },
    },
  },
  response: {
    200: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
};

export const blanksListSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      per_page: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      vkmo_id: { type: 'string' },
      status: { type: 'string', enum: [...BLANK_STATUSES] },
      type: { type: 'string', enum: [...BLANK_TYPES] },
      place: { type: 'string', enum: [...BLANK_PLACES] },
      search: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        data: { type: 'array', items: blankItemSchema },
        meta: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export const blankCardSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        number: { type: 'string' },
        type: { type: 'string', enum: [...BLANK_TYPES] },
        status: { type: 'string', enum: [...BLANK_STATUSES] },
        place: { type: 'string', enum: [...BLANK_PLACES] },
        type_label: { type: 'string' },
        status_label: { type: 'string' },
        place_label: { type: 'string' },
        location_label: { type: 'string' },
        vkmo_id: { type: 'string' },
        vkmo_name: { type: ['string', 'null'] },
        owner: ownerSchema,
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
        operations: { type: 'array', items: operationItemSchema },
      },
    },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
  },
};

export const operationsListSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      blank_id: { type: 'string' },
      status: { type: 'string', enum: [...OPERATION_STATUSES] },
      type: { type: 'string', enum: [...OPERATION_TYPES] },
      vkmo_id: { type: 'string' },
      date_from: { type: 'string' },
      date_to: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        data: { type: 'array', items: operationItemSchema },
        meta: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export const receiptSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['org_unit_id', 'operator_id', 'type'],
    properties: {
      org_unit_id: { type: 'string' },
      operator_id: { type: 'string' },
      type: { type: 'string', enum: [...BLANK_TYPES] },
      reason: { type: 'string' },
      // Либо явный список номеров, либо диапазон серии.
      numbers: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5000 },
      series: {
        type: 'object',
        additionalProperties: false,
        required: ['letters', 'from', 'to'],
        properties: {
          letters: { type: 'string' },
          from: { type: 'integer', minimum: 0, maximum: 999999 },
          to: { type: 'integer', minimum: 0, maximum: 999999 },
        },
      },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: true,
      properties: {
        receipt_id: { type: 'string' },
        org_unit_id: { type: 'string' },
        type: { type: 'string' },
        created_count: { type: 'integer' },
        skipped_count: { type: 'integer' },
        range: { type: ['object', 'null'], additionalProperties: true },
        skipped: { type: 'array', items: { type: 'string' } },
      },
    },
    400: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
  },
};

export const distributeSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['from_org_unit_id', 'to_org_unit_id', 'operator_id'],
    properties: {
      from_org_unit_id: { type: 'string' },
      to_org_unit_id: { type: 'string' },
      operator_id: { type: 'string' },
      type: { type: 'string', enum: [...BLANK_TYPES] },
      count: { type: 'integer', minimum: 1, maximum: 5000 },
      blank_ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
      reason: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: true,
      properties: {
        moved_count: { type: 'integer' },
        from_org_unit_id: { type: 'string' },
        to_org_unit_id: { type: 'string' },
        blanks: { type: 'array', items: blankItemSchema },
      },
    },
    400: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    409: {
      type: 'object',
      additionalProperties: true,
      properties: { error: { type: 'string' }, available: { type: 'integer' } },
    },
  },
};

export const pendingSignaturesSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { vkmo_id: { type: 'string' } },
  },
  response: {
    200: { type: 'array', items: pendingSignatureSchema },
  },
};

export const operationCreateSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['blank_id', 'type', 'operator_id'],
    properties: {
      blank_id: { type: 'string' },
      type: { type: 'string', enum: ['issue', 'return', 'replacement', 'storage', 'write_off'] },
      operator_id: { type: 'string' },
      reason: { type: 'string' },
      owner_id: { type: 'string' },
      comment: { type: 'string' },
      operator_comment: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: true,
      properties: {
        operation: operationItemSchema,
        blank: blankItemSchema,
        requires_signature: { type: 'boolean' },
      },
    },
    400: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
  },
};

export const citizensListSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { search: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: { id: { type: 'string' }, full_name: { type: 'string' }, snils: { type: ['string', 'null'] } },
          },
        },
        meta: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export const orgUnitsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { root_org_unit_id: { type: 'string' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        flat: { type: 'array', items: { type: 'object', additionalProperties: true } },
        tree: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
    },
  },
};

export const auditListSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      per_page: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      category: { type: 'string' },
      user_id: { type: 'string' },
      date_from: { type: 'string' },
      date_to: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        data: { type: 'array', items: { type: 'object', additionalProperties: true } },
        meta: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export const operationSignSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['commissioner_id', 'signature'],
    properties: {
      commissioner_id: { type: 'string' },
      signature: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: { operation: operationItemSchema, blank: blankItemSchema },
    },
    400: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    409: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
  },
};

export const operationRejectSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['commissioner_id'],
    properties: {
      commissioner_id: { type: 'string' },
      reason: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: { operation: operationItemSchema },
    },
    400: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    404: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
    409: { type: 'object', additionalProperties: true, properties: { error: { type: 'string' } } },
  },
};
