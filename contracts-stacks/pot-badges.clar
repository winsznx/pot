;; pot-badges - NFTs for backer + creator milestones. Anyone with a qualifying
;; pot interaction can mint their badge; no whitelist gating.

(define-non-fungible-token pot-badge uint)

(define-constant ERR-NOT-EARNED (err u600))
(define-constant ERR-ALREADY-MINTED (err u601))
(define-constant ERR-NOT-OWNER (err u602))

(define-data-var owner principal tx-sender)
(define-data-var base-uri (string-ascii 96) "https://pot.timjosh507.workers.dev/api/badges/")
(define-data-var next-token-id uint u0)

(define-map minted { user: principal, kind: (string-ascii 16) } bool)

(define-public (claim-backer-badge (pot-id uint) (contributed-wei uint))
  (let ((id (var-get next-token-id)))
    (asserts! (> contributed-wei u0) ERR-NOT-EARNED)
    (asserts! (is-none (map-get? minted { user: tx-sender, kind: "backer" })) ERR-ALREADY-MINTED)
    (try! (nft-mint? pot-badge id tx-sender))
    (map-set minted { user: tx-sender, kind: "backer" } true)
    (var-set next-token-id (+ id u1))
    (print { event: "claimed", id: id, who: tx-sender, kind: "backer", pot-id: pot-id })
    (ok id)))

(define-public (claim-creator-badge (pot-id uint))
  (let ((id (var-get next-token-id)))
    (asserts! (is-none (map-get? minted { user: tx-sender, kind: "creator" })) ERR-ALREADY-MINTED)
    (try! (nft-mint? pot-badge id tx-sender))
    (map-set minted { user: tx-sender, kind: "creator" } true)
    (var-set next-token-id (+ id u1))
    (print { event: "claimed", id: id, who: tx-sender, kind: "creator", pot-id: pot-id })
    (ok id)))

(define-public (set-base-uri (new-uri (string-ascii 96)))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
    (var-set base-uri new-uri)
    (ok true)))

(define-read-only (get-token-uri (id uint))
  (ok (some (var-get base-uri))))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? pot-badge id)))
