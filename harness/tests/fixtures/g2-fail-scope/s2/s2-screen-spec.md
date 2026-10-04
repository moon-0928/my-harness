# S2

## 화면: 내 자산

### 목적
내 자산에서 내 자산의 상태를 확인하고 관리한다.

### 유저스토리
- #3
- #6

### 컴포넌트
| 레이어 이름 | 역할 | 기본값 |
|---|---|---|
| asset-card | 자산 카드 | - |
| review-status | 검수 상태 | 임시저장 |
| visibility-select | 공개 범위 선택 | 비공개 |
| button-primary | 새 자산 등록 | - |

### 상태
- Asset.visibility: for_sale
- Asset.review_status: selling

### 데이터 필드
- Asset.title
- Purchase.price
- Asset.sales_count

## 화면: 자산 상세

### 유저스토리
- #3
- #4

### 컴포넌트
| 레이어 이름 | 역할 | 기본값 |
|---|---|---|
| asset-detail | 자산 상세 | - |
| review-status | 검수 상태 | 임시저장 |
| visibility-select | 공개 범위 선택 | 비공개 |

### 상태
- Asset.visibility: private
- Asset.review_status: pending
- Asset.review_status: approved

### 데이터 필드
- Asset.title
- Asset.visibility
- Asset.review_status
- Asset.updated_at
