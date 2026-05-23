import { keccak256, encodePacked } from "viem";

/**
 * Hash the off-chain pot metadata. The contract stores only the hash; the
 * actual title / story / image URL lives off-chain (Supabase later) keyed by
 * this hash.
 *
 * Hash domain mixes the creator address + a nonce so the same title/story
 * from the same creator on different days hashes differently.
 */
export function hashPotMetadata(input: {
  title: string;
  story: string;
  imageUrl?: string;
  creator: `0x${string}`;
  nonce: bigint;
}): `0x${string}` {
  return keccak256(
    encodePacked(
      ["string", "string", "string", "address", "uint256"],
      [input.title, input.story, input.imageUrl ?? "", input.creator, input.nonce],
    ),
  );
}

export function metadataLooksValid(input: { title: string; story: string }): boolean {
  return input.title.trim().length >= 4 && input.story.trim().length >= 20;
}
