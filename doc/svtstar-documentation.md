# SVTStar — documentation

## 1. Principe

SVTStar est un QCM de révision de SVT, chapitre par chapitre. Chaque question propose quatre réponses, dont une seule est juste. Le but est de réussir toutes les questions du chapitre en perdant le moins de points possible.

## 2. Déroulement d'une partie

- Le joueur commence avec **20 points** : les chapitres ont peu de questions par niveau, un départ plus haut laisserait une marge telle qu'on ne pourrait presque plus perdre.
- La **première passe** pose toutes les questions du mode choisi. Une erreur ne l'arrête pas : la bonne réponse et l'explication s'affichent, des points sont retirés et la question est mise de côté.
- À la fin de la passe, une **nouvelle passe** repose seulement les questions ratées. On recommence ainsi jusqu'à ce qu'il n'y ait plus d'erreur. Une question réussie n'est plus posée de la partie.
- La partie est **gagnée** quand toutes les questions ont été réussies.
- La partie est **perdue** dès que les points tombent à 0 : il faut recommencer.
- Le bouton « Recommencer » relance une partie à tout moment, pour battre son score. « Abandonner » ramène au menu sans enregistrer de score (les erreurs déjà faites restent comptées dans les questions les plus ratées).

### Points retirés par erreur

| Niveau | Erreur |
|---|---|
| Facile | −3 points |
| Moyen | −2 points |
| Difficile | −1 point |

Une erreur sur une question facile coûte le plus cher, parce que c'est ce qu'il faut savoir en premier. Une question ratée de nouveau lors d'une passe suivante coûte encore ses points. Les points ne descendent pas sous 0.

## 3. Ordre des questions

Chaque question a un niveau : 1 (facile), 2 (moyen) ou 3 (difficile). À chaque passe, les questions faciles viennent d'abord, puis les moyennes, puis les difficiles. Dans chaque niveau, l'ordre des questions est tiré au hasard, comme l'ordre des quatre réponses.

Les niveaux du chapitre « climat » :

| Niveau | Contenu |
|---|---|
| Facile (11) | Où la lumière est la plus concentrée, air chaud qui monte et air froid qui descend, les vents, les trois outils qui produisent de l'électricité, la fumée qui évite la coupelle glacée. |
| Moyen (5) | Ce qui change entre l'équateur et le pôle dans le modèle (la taille de la surface éclairée), le résultat de l'expérience du courant océanique (eau froide au fond, colorant chaud qui remonte), l'élément de base du panneau solaire, l'énergie hydraulique. |
| Difficile (5) | Les explications : pourquoi la lumière s'étale près des pôles, pourquoi l'équateur est plus chaud, ce qui ne change pas dans le modèle, les ressources renouvelables, le point commun entre vents et courants. |

## 4. Modes de jeu

| Mode | Questions | Étoiles et record |
|---|---|---|
| Tout le chapitre | toutes | oui |
| Entraînement facile | niveau 1 seulement | non |
| Entraînement moyen | niveau 2 seulement | non |
| Entraînement difficile | niveau 3 seulement | non |

Les entraînements suivent les mêmes règles : 20 points, passes successives, partie perdue à 0. Ils servent à travailler un niveau sans toucher au classement. Les erreurs qu'on y fait comptent dans les questions les plus ratées.

## 5. Étoiles, records et classement

- **Étoiles** = points à la fin d'une partie gagnée ÷ 4, arrondi à l'inférieur, 5 au maximum. Sans faute (20 points) donne 5 étoiles ; 10 points donnent 2 étoiles ; moins de 4 points, aucune.
- Chaque joueur garde, par chapitre, son **record** : le meilleur score d'une partie gagnée en mode « Tout le chapitre ». Il garde aussi son nombre de parties et le nombre de fois où il a raté chaque question.
- Le **classement** d'un chapitre range les joueurs de l'appareil qui l'ont terminé, selon leur record.
- Les joueurs sont créés sur l'appareil (prénom ou pseudo). Les données sont dans `localStorage`, avec le préfixe `svtstar:`. Supprimer un joueur efface aussi ses records.

## 6. Écrans

1. **Qui joue ?** : choisir un joueur, en créer un ou en supprimer un (avec confirmation).
2. **Menu** : choisir le chapitre (record et étoiles affichés) et le mode de jeu, voir le classement, puis « Commencer ».
3. **Question** :
   - points restants et étoiles correspondantes (ou le mode d'entraînement) ;
   - record, nombre d'erreurs, nombre de questions restant à réussir ;
   - passe en cours (« Première passe » ou « Passe 2 : révision des erreurs »), barre de progression dans la passe ;
   - niveau de la question et ce que coûterait une erreur ;
   - après la réponse : bonne réponse en vert, erreur en rouge barrée, points retirés et explication ; à la dernière question d'une passe, le bouton annonce le nombre d'erreurs à revoir.
4. **Résultat** : partie gagnée (« Sans faute ! » ou « Chapitre terminé ») ou perdue, points, étoiles, nombre d'erreurs et de passes, nouveau record éventuel, classement, et les cinq questions que le joueur rate le plus souvent.

Au clavier : touches 1 à 4 pour répondre, Entrée pour continuer. Sur téléphone, les réponses forment une grille de deux et les indications clavier sont masquées.

## 7. Ajouter ou modifier des questions

Les questions sont dans des fichiers TSV (texte séparé par des tabulations), modifiables dans un tableur (LibreOffice Calc : ouvrir en choisissant « Tabulation » comme séparateur, enregistrer au même format).

`chapitres/chapitres.tsv` liste les chapitres :

| Colonne | Contenu |
|---|---|
| id | identifiant court et unique (`climat`…) ; les records y sont rattachés, ne pas le changer |
| matiere | SVT, Physique-chimie… |
| numero | numéro du chapitre |
| titre | titre affiché |
| fichier | nom du fichier de questions dans `chapitres/` |
| actif | `oui` ou `non` |

Chaque fichier de questions (`chapitres/climat.tsv`…) :

| Colonne | Contenu |
|---|---|
| niveau | 1, 2 ou 3 |
| question | l'énoncé |
| bonne_reponse | la seule bonne réponse |
| pieges | trois mauvaises réponses séparées par « / » |
| explication | affichée après la réponse : rappel du cours |
| actif | `oui` ou `non` (`non` garde la question dans le fichier sans la jouer) |

Puis :

```
python3 -I outils/chapitres_vers_js.py
```

Le script vérifie les fichiers et génère `questions-data.js`. Il refuse une question sans exactement trois pièges, une réponse en double, un niveau invalide ou une question en double. La liste des erreurs indique le fichier et la ligne.

Le texte d'une question sert aussi de clé pour le compteur « questions les plus ratées » : modifier l'énoncé remet son compteur à zéro.

## 8. Écrire de bonnes questions

- Tirer les questions du cours du professeur, avec son vocabulaire (« élément de base », « élément final », « coupelle glacée »), pour réviser exactement ce qui sera demandé.
- Des pièges plausibles et de même nature que la réponse : un outil contre d'autres outils, une énergie contre d'autres énergies. Un piège absurde rend la question trop facile.
- Utiliser comme pièges les idées fausses courantes quand elles existent (« l'équateur est plus près du Soleil »).
- Une seule réponse défendable : éviter les pièges vrais par ailleurs.
- Un fait du cours, une question : pas de question qui repose le même fait dans l'autre sens, et pas d'énoncé qui donne la réponse d'une autre question.
- Des réponses de longueur proche, pour que la plus longue ne soit pas toujours la bonne.
- Pour le niveau difficile : faire expliquer le résultat d'une expérience ou relier deux parties du cours (lumière concentrée → chaleur → mouvements d'air et d'eau).

## 9. Publication

Le workflow `.github/workflows/pages.yml` génère `questions-data.js` (une erreur dans les questions bloque la publication) et publie `index.html`, les `.js` et `style.css` sur GitHub Pages. Le lien « EduStar » de la barre du haut pointe vers `../edustar/`, la page qui regroupe les cours et les jeux de révision : le dépôt `edustar` doit rester à côté de celui-ci.

Les questions du chapitre « climat » sont tirées du cours de SVT du professeur : activité 4 (modèle lampe-tube-globe, expérience de la fumée, expérience du courant océanique froid), bilan 4 et activité 7 (les énergies). Le cours lui-même n'est pas dans le dépôt.
