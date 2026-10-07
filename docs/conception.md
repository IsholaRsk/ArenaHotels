# Arena Hotels — Conception

> Diagrammes de **cas d'utilisation**, de **classes** et **MLDR** (Modèle Logique de Données Relationnel).
> Les diagrammes sont écrits en [Mermaid](https://mermaid.js.org) : ils s'affichent nativement sur GitHub, GitLab, VS Code (extension Markdown Preview Mermaid) et Notion.

---

## 1. Diagramme de cas d'utilisation

Trois acteurs : **Client**, **Réceptionniste**, **Administrateur** (hiérarchie de rôles d'un `Utilisateur`).

```mermaid
flowchart LR
  Client((Client))
  Receptionniste(("Réceptionniste"))
  Admin(("Administrateur"))

  subgraph SYS["Système de réservation — Arena Hotels"]
    direction TB
    UC1(["S'authentifier"])
    UC2(["Consulter les chambres"])
    UC3(["Vérifier les disponibilités"])
    UC4(["Réserver"])
    UC5(["Consulter ses réservations"])
    UC6(["Annuler sa réservation"])
    UC7(["Gérer son profil"])
    UC8(["Gérer les réservations"])
    UC9(["Check-in / Check-out"])
    UC10(["Gérer les clients"])
    UC11(["Gérer les chambres"])
    UC12(["Gérer les tarifs"])
    UC13(["Consulter les statistiques"])
    UC14(["Gérer les utilisateurs"])
    UC15(["Paramètres · permissions · journal"])
  end

  Client --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7
  Receptionniste --> UC1 & UC2 & UC3 & UC4 & UC8 & UC9 & UC10 & UC11 & UC13
  Admin --> UC1 & UC2 & UC3 & UC4 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15

  UC6 -. "«extend»" .-> UC5
  UC9 -. "«extend»" .-> UC8
  UC12 -. "«extend»" .-> UC11
```

### Matrice de droits (rôle → cas d'utilisation)

| Fonctionnalité | Client | Réceptionniste | Admin |
|---|:---:|:---:|:---:|
| Voir chambres | ✅ | ✅ | ✅ |
| Réserver | ✅ | ✅ | ✅ |
| Modifier réservation | ses réservations | ✅ | ✅ |
| Annuler réservation | ses réservations | ✅ | ✅ |
| Voir réservations | les siennes | toutes | toutes |
| Check-in / Check-out | ❌ | ✅ | ✅ |
| Gérer clients | son profil | ✅ | ✅ |
| Gérer chambres | ❌ | ⚠️ (maj only) | ✅ |
| Gérer tarifs | ❌ | ❌ | ✅ |
| Gérer paiements | ses paiements | ✅ | ✅ |
| Facturation | ses factures | ✅ | ✅ |
| Statistiques | ❌ | ⚠️ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ✅ |
| Gérer permissions | ❌ | ❌ | ✅ |
| Paramètres système | ❌ | ❌ | ✅ |
| Journal d'activité | ❌ | ❌ | ✅ |

---

## 2. Diagramme de classes

```mermaid
classDiagram
  direction LR

  class Utilisateur {
    +int id
    +string nom
    +string email
    +string motDePasse
    +Role role
    +boolean actif
    +Date creeLe
    +Date majLe
    +seConnecter()
  }

  class Client {
    +int id
    +string nom
    +string prenom
    +string email
    +string telephone
    +string adresse
    +string ville
    +string pays
    +string notes
    +Date creeLe
    +Date majLe
  }

  class Chambre {
    +int id
    +string numero
    +TypeChambre type
    +float prixParNuit
    +int capacite
    +int etage
    +string description
    +StatutChambre statut
    +estDisponible(arrivee, depart) bool
  }

  class Reservation {
    +int id
    +string reference
    +Date dateArrivee
    +Date dateDepart
    +int nombrePersonnes
    +StatutReservation statut
    +float montantTotal
    +string notes
    +calculerMontant() float
    +verifierDisponibilite() bool
  }

  class Role {
    <<enumeration>>
    ADMIN
    RECEPTIONNISTE
    CLIENT
  }
  class TypeChambre {
    <<enumeration>>
    SIMPLE
    DOUBLE
    TWIN
    SUITE
    FAMILIALE
  }
  class StatutChambre {
    <<enumeration>>
    LIBRE
    OCCUPEE
    MAINTENANCE
  }
  class StatutReservation {
    <<enumeration>>
    EN_ATTENTE
    CONFIRMEE
    ANNULEE
    TERMINEE
  }
  class Permission {
    <<enumeration>>
    RESERVATION_CREATE
    RESERVATION_READ
    RESERVATION_UPDATE
    RESERVATION_CANCEL
    CLIENT_READ
    CLIENT_UPDATE
    ROOM_CREATE
    ROOM_UPDATE
    ROOM_DELETE
    PAYMENT_READ
    PAYMENT_CREATE
    USER_CREATE
    USER_UPDATE
    USER_DELETE
    REPORT_READ
    SETTINGS_UPDATE
  }

  Utilisateur "1" --> "1" Role : possède
  Utilisateur "1" ..> "0..1" Client : correspond (même email)
  Client "1" --> "0..*" Reservation : effectue
  Chambre "1" --> "0..*" Reservation : est réservée par
  Chambre --> TypeChambre
  Chambre --> StatutChambre
  Reservation --> StatutReservation
  Role ..> Permission : donne accès (ROLE_PERMISSIONS)
```

**Règles de gestion principales**
- Une `Reservation` relie exactement **un `Client`** et **une `Chambre`**.
- **Unicité de la période** : deux réservations bloquantes (`EN_ATTENTE`, `CONFIRMEE`) ne peuvent pas se chevaucher pour une même chambre (pas de sur-réservation).
- `dateDepart > dateArrivee` ; `nombrePersonnes ≤ chambre.capacite`.
- `montantTotal = nombreDeNuits × chambre.prixParNuit`.
- **Transitions de statut** autorisées : `EN_ATTENTE → {CONFIRMEE, ANNULEE}`, `CONFIRMEE → {TERMINEE, ANNULEE}`, `ANNULEE → {EN_ATTENTE}`, `TERMINEE → {}`.
- Un **CLIENT** n'agit que sur **ses propres** réservations/fiche ; il peut **annuler** mais pas confirmer ni faire le check-in/out.

---

## 3. MLDR — Modèle Logique de Données Relationnel

### 3.1 Schéma relationnel

```mermaid
erDiagram
  UTILISATEUR ||--o| CLIENT : "même email (lien logique)"
  CLIENT ||--o{ RESERVATION : "effectue (client_id)"
  CHAMBRE ||--o{ RESERVATION : "concerne (chambre_id)"

  UTILISATEUR {
    int id PK
    varchar nom
    varchar email UK
    varchar mot_de_passe
    varchar role
    boolean actif
    timestamp cree_le
    timestamp maj_le
  }
  CLIENT {
    int id PK
    varchar nom
    varchar prenom
    varchar email UK
    varchar telephone
    text adresse
    varchar ville
    varchar pays
    text notes
    timestamp cree_le
    timestamp maj_le
  }
  CHAMBRE {
    int id PK
    varchar numero UK
    varchar type
    float prix_par_nuit
    int capacite
    int etage
    text description
    varchar statut
    timestamp cree_le
    timestamp maj_le
  }
  RESERVATION {
    int id PK
    varchar reference UK
    int chambre_id FK
    int client_id FK
    varchar date_arrivee
    varchar date_depart
    int nombre_personnes
    varchar statut
    float montant_total
    text notes
    timestamp cree_le
    timestamp maj_le
  }
```

### 3.2 Notation textuelle

Légende : **souligné** = clé primaire (PK) · `#` = clé étrangère (FK) · `U` = unique.

- **UTILISATEUR** (<u>id</u>, nom, email `U`, mot_de_passe, role, actif, cree_le, maj_le)
- **CLIENT** (<u>id</u>, nom, prenom, email `U`, telephone, adresse, ville, pays, notes, cree_le, maj_le)
- **CHAMBRE** (<u>id</u>, numero `U`, type, prix_par_nuit, capacite, etage, description, statut, cree_le, maj_le)
- **RESERVATION** (<u>id</u>, reference `U`, #chambre_id, #client_id, date_arrivee, date_depart, nombre_personnes, statut, montant_total, notes, cree_le, maj_le)
  - #chambre_id → CHAMBRE(id) · #client_id → CLIENT(id)

### 3.3 Dictionnaire des données (extraits)

| Table | Colonne | Type | Contraintes | Description |
|---|---|---|---|---|
| UTILISATEUR | role | varchar(20) | ADMIN / RECEPTIONNISTE / CLIENT | Rôle d'autorisation |
| UTILISATEUR | email | varchar(160) | UNIQUE | Identifiant de connexion |
| CLIENT | email | varchar(160) | UNIQUE | Lien logique avec le compte |
| CHAMBRE | numero | varchar(20) | UNIQUE | Ex. « 101 » |
| CHAMBRE | type | varchar(20) | SIMPLE/DOUBLE/TWIN/SUITE/FAMILIALE | Catégorie |
| CHAMBRE | statut | varchar(20) | LIBRE/OCCUPEE/MAINTENANCE | État courant |
| RESERVATION | date_arrivee | varchar(10) | format `YYYY-MM-DD` | Nuit d'arrivée |
| RESERVATION | date_depart | varchar(10) | `> date_arrivee` | Nuit de départ |
| RESERVATION | statut | varchar(20) | EN_ATTENTE/CONFIRMEE/ANNULEE/TERMINEE | Cycle de vie |
| RESERVATION | montant_total | float | calculé | nuits × prix_par_nuit |

> **Cardinalités** : un `CLIENT` effectue `0..N` `RESERVATION` ; une `CHAMBRE` est concernée par `0..N` `RESERVATION`. Un `UTILISATEUR` (rôle CLIENT) correspond à `0..1` `CLIENT` (association logique par email — la fiche client est créée automatiquement à la première réservation).
