export const AUTHENTICATE_WITH_TELEGRAM_MUTATION = /* GraphQL */ `
  mutation AuthenticateWithTelegram($input: TelegramAuthInput!) {
    authenticateWithTelegram(input: $input) {
      token
      user {
        id
        telegramId
        username
        firstName
        email
        role
        createdAt
      }
    }
  }
`;

export const GENERATE_DEV_TELEGRAM_INIT_DATA_QUERY = /* GraphQL */ `
  query GenerateDevTelegramInitData($userId: String, $username: String, $firstName: String, $lastName: String) {
    generateDevTelegramInitData(userId: $userId, username: $username, firstName: $firstName, lastName: $lastName)
  }
`;

export const LOGIN_AS_DEMO_FOUNDER_MUTATION = /* GraphQL */ `
  mutation LoginAsDemoFounder {
    loginAsDemoFounder {
      token
      user {
        id
        telegramId
        username
        firstName
        email
        role
        createdAt
      }
    }
  }
`;

export const GET_ME_QUERY = /* GraphQL */ `
  query GetMe {
    me {
      id
      telegramId
      username
      firstName
      email
      role
      createdAt
    }
  }
`;

export const CHECK_USER_EXISTS_QUERY = /* GraphQL */ `
  query CheckUserExists($identifier: String!) {
    checkUserExists(identifier: $identifier) {
      exists
      user {
        id
        telegramId
        username
        firstName
        email
        role
        createdAt
      }
    }
  }
`;

export const REGISTER_USER_MUTATION = /* GraphQL */ `
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
      user {
        id
        telegramId
        username
        firstName
        email
        role
        createdAt
      }
    }
  }
`;

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts {
    products {
      id
      slug
      title
      type
      priceUsd
      description
      tier
      badge
      version
      fileSize
      componentCount
      features
      artifactKey
      isActive
      createdAt
    }
  }
`;

export const GET_MY_PURCHASES_QUERY = /* GraphQL */ `
  query MyPurchases {
    myPurchases {
      id
      userId
      productId
      amountUsd
      status
      downloadUrl
      createdAt
      product {
        id
        slug
        title
        type
        priceUsd
        description
        tier
        badge
        version
        fileSize
        componentCount
        features
        artifactKey
        isActive
        createdAt
      }
    }
  }
`;

export const GET_MY_ORDERS_QUERY = /* GraphQL */ `
  query MyOrders {
    myOrders {
      id
      orderNumber
      userId
      title
      budgetUsd
      status
      sprint
      deliveryDate
      nextReviewDate
      milestones {
        id
        step
        title
        description
        status
        completedAt
        createdAt
        updatedAt
      }
      createdAt
    }
  }
`;

export const GET_SYSTEM_SHOWCASES_QUERY = /* GraphQL */ `
  query GetSystemShowcases {
    systemShowcases {
      id
      slug
      number
      category
      title
      tagline
      description
      topology
      metrics
      recentLog
      sortOrder
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const INIT_PURCHASE_MUTATION = /* GraphQL */ `
  mutation InitPurchase($input: InitPurchaseInput!) {
    initPurchase(input: $input) {
      id
      userId
      productId
      amountUsd
      status
      downloadUrl
      createdAt
    }
  }
`;

export const GET_DIGITAL_DOWNLOAD_URL_QUERY = /* GraphQL */ `
  query GetDigitalDownloadUrl($purchaseId: String!) {
    getDigitalDownloadUrl(purchaseId: $purchaseId)
  }
`;

export const SUBMIT_LEAD_MUTATION = /* GraphQL */ `
  mutation SubmitLead($input: CreateLeadInput!) {
    submitLead(input: $input) {
      id
      name
      contact
      budget
      description
      status
      createdAt
    }
  }
`;

export const GET_LEADS_QUERY = /* GraphQL */ `
  query GetLeads {
    leads {
      id
      name
      contact
      budget
      description
      status
      createdAt
    }
  }
`;

export const GET_LEAD_QUERY = /* GraphQL */ `
  query GetLead($id: String!) {
    lead(id: $id) {
      id
      name
      contact
      budget
      description
      status
      createdAt
    }
  }
`;

export interface CreateLeadInput {
  name: string;
  contact: string;
  budget: string;
  description: string;
  serviceType?: string;
  referrer?: string;
  idempotencyKey?: string;
}

export interface LeadResponse {
  id: string;
  name: string;
  contact: string;
  budget: string;
  description: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}
