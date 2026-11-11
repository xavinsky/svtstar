# SVTStar

Jeu de révision de SVT en QCM, chapitre par chapitre. On part de 20 points ; les questions ratées reviennent à chaque passe jusqu'à ce que tout soit réussi, et chaque erreur coûte des points. Étoiles selon le score final, modes d'entraînement par niveau, profils de joueurs, record et classement par chapitre.

Chapitres :
- SVT, chapitre 1 : le climat, les mouvements d'air et d'eau sur Terre, et les énergies qu'on en tire.

Fait partie d'[EduStar](https://tekio.org/edustar/).

## En local

```
python3 -I outils/chapitres_vers_js.py   # vérifie chapitres/ et génère questions-data.js
```

puis ouvrir `index.html`.

## Documentation

`doc/svtstar-documentation.md` : fonctionnement du jeu, ajout d'un chapitre, écriture des questions.

## Licence

MIT, voir `LICENCE`.
