package kr.byeongmin.stockdaejang.domain.dashboard.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import java.math.BigInteger

@Entity
@Table(
    name = "dashboard_positions",
    uniqueConstraints = [
        UniqueConstraint(
            name = "dashboard_positions_identity_unique",
            columnNames = ["owner_id", "brokerage_id", "security_id"],
        ),
    ],
)
class DashboardPosition(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    val owner: Owner,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brokerage_id", nullable = false)
    val brokerage: Brokerage,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false)
    val security: Security,

    @Column(name = "quantity", nullable = false, precision = 38, scale = 0)
    var quantity: BigInteger,

    @Column(name = "total_buy_amount", nullable = false, precision = 38, scale = 0)
    var totalBuyAmount: BigInteger,
)
