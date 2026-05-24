export type TdpSolana = {
  version: "0.1.0";
  name: "tdp_solana";
  instructions: [
    {
      name: "createStream";
      discriminator: number[];
      accounts: [
        { name: "creator"; isMut: true; isSigner: true },
        { name: "stream"; isMut: true; isSigner: false },
        { name: "mint"; isMut: false; isSigner: false },
        { name: "creatorTokenAccount"; isMut: true; isSigner: false },
        { name: "escrowAuthority"; isMut: false; isSigner: false },
        { name: "escrowTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "streamId"; type: "u64" },
        { name: "recipient"; type: "pubkey" },
        { name: "totalAmount"; type: "u64" },
        { name: "startTime"; type: "i64" },
        { name: "cliffTime"; type: "i64" },
        { name: "endTime"; type: "i64" },
        { name: "cancelable"; type: "bool" },
        { name: "milestoneBased"; type: "bool" }
      ];
    },
    {
      name: "withdraw";
      discriminator: number[];
      accounts: [
        { name: "recipient"; isMut: true; isSigner: true },
        { name: "stream"; isMut: true; isSigner: false },
        { name: "mint"; isMut: false; isSigner: false },
        { name: "escrowAuthority"; isMut: false; isSigner: false },
        { name: "escrowTokenAccount"; isMut: true; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "cancelStream";
      discriminator: number[];
      accounts: [
        { name: "creator"; isMut: true; isSigner: true },
        { name: "recipientAuthority"; isMut: false; isSigner: false },
        { name: "stream"; isMut: true; isSigner: false },
        { name: "mint"; isMut: false; isSigner: false },
        { name: "escrowAuthority"; isMut: false; isSigner: false },
        { name: "escrowTokenAccount"; isMut: true; isSigner: false },
        { name: "creatorTokenAccount"; isMut: true; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "associatedTokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "Stream";
      discriminator: number[];
    }
  ];
  types: [
    {
      name: "Stream";
      type: {
        kind: "struct";
        fields: [
          { name: "creator"; type: "pubkey" },
          { name: "recipient"; type: "pubkey" },
          { name: "mint"; type: "pubkey" },
          { name: "escrowTokenAccount"; type: "pubkey" },
          { name: "streamId"; type: "u64" },
          { name: "totalAmount"; type: "u64" },
          { name: "withdrawnAmount"; type: "u64" },
          { name: "startTime"; type: "i64" },
          { name: "cliffTime"; type: "i64" },
          { name: "endTime"; type: "i64" },
          { name: "cancelable"; type: "bool" },
          { name: "canceled"; type: "bool" },
          { name: "milestoneBased"; type: "bool" },
          { name: "milestoneReached"; type: "bool" },
          { name: "bump"; type: "u8" },
          { name: "escrowBump"; type: "u8" },
          { name: "createdAt"; type: "i64" }
        ];
      };
    }
  ];
};

export const IDL: TdpSolana = {
  version: "0.1.0",
  name: "tdp_solana",
  instructions: [
    {
      name: "createStream",
      discriminator: [71, 188, 111, 127, 108, 40, 229, 158],
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "stream", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "creatorTokenAccount", isMut: true, isSigner: false },
        { name: "escrowAuthority", isMut: false, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "streamId", type: "u64" },
        { name: "recipient", type: "pubkey" },
        { name: "totalAmount", type: "u64" },
        { name: "startTime", type: "i64" },
        { name: "cliffTime", type: "i64" },
        { name: "endTime", type: "i64" },
        { name: "cancelable", type: "bool" },
        { name: "milestoneBased", type: "bool" },
      ],
    },
    {
      name: "withdraw",
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        { name: "recipient", isMut: true, isSigner: true },
        { name: "stream", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "escrowAuthority", isMut: false, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "cancelStream",
      discriminator: [218, 221, 38, 25, 177, 207, 188, 91],
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "recipientAuthority", isMut: false, isSigner: false },
        { name: "stream", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "escrowAuthority", isMut: false, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "creatorTokenAccount", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Stream",
      discriminator: [166, 224, 59, 4, 202, 10, 186, 83],
    },
  ],
  types: [
    {
      name: "Stream",
      type: {
        kind: "struct",
        fields: [
          { name: "creator", type: "pubkey" },
          { name: "recipient", type: "pubkey" },
          { name: "mint", type: "pubkey" },
          { name: "escrowTokenAccount", type: "pubkey" },
          { name: "streamId", type: "u64" },
          { name: "totalAmount", type: "u64" },
          { name: "withdrawnAmount", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "cliffTime", type: "i64" },
          { name: "endTime", type: "i64" },
          { name: "cancelable", type: "bool" },
          { name: "canceled", type: "bool" },
          { name: "milestoneBased", type: "bool" },
          { name: "milestoneReached", type: "bool" },
          { name: "bump", type: "u8" },
          { name: "escrowBump", type: "u8" },
          { name: "createdAt", type: "i64" },
        ],
      },
    },
  ],
};
