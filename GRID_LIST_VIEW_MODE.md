# Mode Grille/Liste Personnalisable 🔲

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de personnaliser l'affichage de leur collection d'albums avec des options de vue flexibles et des préférences sauvegardées.

## Fonctionnalités

### 1. Modes d'affichage

- **🔲 Grille** (par défaut) : Affichage standard avec overlay complet au survol
- **📋 Compacte** : Vue minimaliste avec seulement le titre et l'artiste
- **📝 Détaillée** : Vue enrichie avec métadonnées supplémentaires (pays, genre)

### 2. Tailles de grille

Choisissez parmi 6 tailles prédéfinies :
- **Très Grandes** : 2 albums par ligne
- **Grandes** : 3 albums par ligne  
- **Moyennes** : 4 albums par ligne
- **Normales** : 5 albums par ligne (par défaut)
- **Petites** : 6 albums par ligne
- **Très Petites** : 8 albums par ligne

### 3. Persistance des préférences

Toutes vos préférences sont automatiquement sauvegardées dans le navigateur et restaurées lors de votre prochaine visite.

## Utilisation

1. Cliquez sur l'icône **👁️** (œil) dans la section des filtres
2. Sélectionnez votre mode d'affichage préféré
3. Choisissez la taille de grille souhaitée
4. Vos préférences sont sauvegardées automatiquement !

## Architecture technique

### Composants

- **ViewControls** (`src/components/ViewControls.jsx`)
  - Menu déroulant avec icônes visuelles
  - Callbacks pour mise à jour des préférences
  - Support du mode clair/sombre

- **useViewPreferences** (`src/utils/useViewPreferences.js`)
  - Hook React personnalisé
  - Gestion du localStorage
  - API simple : `{ viewMode, gridSize, setViewMode, setGridSize }`

- **AlbumCard** (`src/components/AlbumCard.jsx`)
  - Prop `viewMode` pour personnalisation
  - Rendu adaptatif selon le mode
  - Mémoïsation optimisée

### Flux de données

```
localStorage 
    ↓
useViewPreferences hook
    ↓
App.jsx (viewMode, gridSize states)
    ↓
ViewControls (menu) + AlbumCard (affichage)
```

### Stockage

Les préférences sont stockées dans `localStorage` sous la clé `disco2000_view_preferences` :

```json
{
  "viewMode": "grid",
  "gridSize": 5
}
```

## Personnalisation future

Des modes supplémentaires peuvent facilement être ajoutés :
- Mode liste horizontal
- Mode mosaïque avec tailles variables
- Mode timeline par année
- Etc.

## Performance

- Mémoïsation des cartes d'album pour éviter les re-renders
- localStorage synchrone mais léger (< 100 bytes)
- Pas d'impact sur le temps de chargement initial
