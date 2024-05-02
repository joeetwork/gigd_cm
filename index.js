import { percentAmount, generateSigner, some } from "@metaplex-foundation/umi";
import crypto from "crypto";
import {
  createNft,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { keypairIdentity } from "@metaplex-foundation/umi";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const umi = createUmi("https://api.devnet.solana.com").use(mplCandyMachine());

// Import your private key file and parse it.
const wallet = process.env.SIGNER;

const secretKey = JSON.parse(wallet);

// Create a keypair from your private key
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));

// Register it to the Umi client.
umi.use(keypairIdentity(keypair));

const revealData = [
  { name: "Nft #1", uri: "http://example.com/1.json" },
  { name: "Nft #2", uri: "http://example.com/2.json" },
  { name: "Nft #3", uri: "http://example.com/3.json" },
];

const string = JSON.stringify(revealData);
const hash = crypto.createHash("sha256").update(string).digest();

// Create the Collection NFT.
const collectionUpdateAuthority = generateSigner(umi);
const collectionMint = generateSigner(umi);
await createNft(umi, {
  mint: collectionMint,
  authority: collectionUpdateAuthority,
  name: "My Collection NFT",
  uri: "https://example.com/path/to/some/json/metadata.json",
  sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
  isCollection: true,
}).sendAndConfirm(umi);

const creatorA = generateSigner(umi).publicKey;
const creatorB = generateSigner(umi).publicKey;
const candyMachineSettings = {
  tokenStandard: TokenStandard.NonFungible,
  sellerFeeBasisPoints: percentAmount(33.3, 2),
  symbol: "MYPROJECT",
  maxEditionSupply: 0,
  isMutable: true,
  creators: [
    { address: creatorA, percentageShare: 50, verified: false },
    { address: creatorB, percentageShare: 50, verified: false },
  ],
  collectionMint: collectionMint.publicKey,
  collectionUpdateAuthority,
  itemsAvailable: 1000000,
  hiddenSettings: some({
    name: "My NFT Project #$ID+1$",
    uri: "https://example.com/path/to/teaser.json",
    hash: hash,
  }),
  configLineSettings: some({
    prefixName: "My NFT Project #$ID+1$",
    nameLength: 0,
    prefixUri: "https://arweave.net/",
    uriLength: 43,
    isSequential: false,
  }),
};
