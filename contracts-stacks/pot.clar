;; Pot - Stacks/Clarity port (draft)
;; Mirrors the Solidity flow: createPot, contribute, withdraw, refund.
;; Settlement asset is sBTC (use SIP-010 trait) to keep parity with the cUSD
;; Celo build. Status enum mirrors PotStatus on the EVM side.

(define-constant ERR-NOT-CREATOR (err u100))
(define-constant ERR-POT-NOT-ACTIVE (err u101))
(define-constant ERR-DEADLINE-PASSED (err u102))
(define-constant ERR-ZERO-AMOUNT (err u103))
(define-constant ERR-INSUFFICIENT (err u104))
(define-constant ERR-ALREADY-SETTLED (err u105))

(define-map pots
  uint
  {
    creator: principal,
    target: uint,
    raised: uint,
    deadline: uint,
    refund-if-missed: bool,
    status: uint, ;; 0=active 1=withdrawn 2=refunded 3=cancelled
    metadata-hash: (buff 32),
  })

(define-map contributions { pot-id: uint, backer: principal } uint)

(define-data-var next-pot-id uint u0)

(define-public (create-pot (target uint) (deadline uint) (refund-if-missed bool) (metadata-hash (buff 32)))
  (let ((id (var-get next-pot-id)))
    (asserts! (or (is-eq deadline u0) (> deadline stacks-block-height)) ERR-DEADLINE-PASSED)
    (map-set pots id
      { creator: tx-sender, target: target, raised: u0, deadline: deadline,
        refund-if-missed: refund-if-missed, status: u0, metadata-hash: metadata-hash })
    (var-set next-pot-id (+ id u1))
    (ok id)))

;; TODO: contribute() - SIP-010 transfer + tally
;; TODO: withdraw() - creator pulls raised once target hit
;; TODO: refund() - backer pulls back stake when deadline passes + target missed
;; TODO: cancel() - creator cancels active pot (when raised == 0)

(define-read-only (get-pot (id uint))
  (map-get? pots id))

(define-read-only (get-next-pot-id)
  (var-get next-pot-id))
