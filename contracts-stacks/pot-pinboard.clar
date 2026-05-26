;; pot-pinboard — anyone can endorse, tag, vote, or flag a pot. No gating
;; beyond a tiny anti-spam STX fee (rotateable). Mirrors the EVM pinboard
;; functions on Pot.sol.

(define-constant ERR-ZERO-AMOUNT (err u800))
(define-constant ERR-NOT-MAINTAINER (err u801))

(define-data-var maintainer principal tx-sender)
(define-data-var endorse-cost uint u10000) ;; 0.01 STX
(define-data-var pin-cost-per-day uint u50000)

(define-map endorsements { pot-id: uint, who: principal } uint) ;; block-height
(define-map pins uint { pinned-until: uint, pinner: principal })
(define-map votes { pot-id: uint, who: principal } bool)
(define-map flags { pot-id: uint, who: principal } (buff 32))
(define-map tags { pot-id: uint, tag: (buff 32) } principal)

(define-public (endorse-pot (pot-id uint))
  (let ((cost (var-get endorse-cost)))
    (try! (stx-transfer? cost tx-sender (var-get maintainer)))
    (map-set endorsements { pot-id: pot-id, who: tx-sender } block-height)
    (print { event: "endorsed", pot-id: pot-id, who: tx-sender, cost: cost })
    (ok true)))

(define-public (vote-pot (pot-id uint))
  (begin
    (map-set votes { pot-id: pot-id, who: tx-sender } true)
    (print { event: "voted", pot-id: pot-id, who: tx-sender })
    (ok true)))

(define-public (flag-pot (pot-id uint) (reason-code (buff 32)))
  (begin
    (map-set flags { pot-id: pot-id, who: tx-sender } reason-code)
    (print { event: "flagged", pot-id: pot-id, who: tx-sender, reason: reason-code })
    (ok true)))

(define-public (tag-pot (pot-id uint) (tag (buff 32)))
  (begin
    (map-set tags { pot-id: pot-id, tag: tag } tx-sender)
    (print { event: "tagged", pot-id: pot-id, tag: tag, by: tx-sender })
    (ok true)))

(define-public (pin-pot (pot-id uint) (days uint))
  (let ((cost (* (var-get pin-cost-per-day) days))
        (until (+ block-height (* days u144))))
    (asserts! (> days u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? cost tx-sender (var-get maintainer)))
    (map-set pins pot-id { pinned-until: until, pinner: tx-sender })
    (print { event: "pinned", pot-id: pot-id, days: days, until: until })
    (ok true)))

(define-public (set-endorse-cost (next uint))
  (begin
    (asserts! (is-eq tx-sender (var-get maintainer)) ERR-NOT-MAINTAINER)
    (var-set endorse-cost next)
    (ok true)))

(define-read-only (get-pin (pot-id uint))
  (map-get? pins pot-id))
