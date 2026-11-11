"""Transforme les chapitres (chapitres/*.tsv, modifiables dans un tableur) en
questions-data.js, chargé par le jeu, après vérification.

chapitres/chapitres.tsv : une ligne par chapitre
  id       identifiant court et unique (ch1, ch2…), sert aussi aux records
  matiere  SVT, Physique-chimie…
  numero   numéro du chapitre dans la matière
  titre    titre affiché
  fichier  fichier des questions, dans chapitres/
  actif    oui ou non

Fichier de questions : une ligne par question
  niveau         1 (facile), 2 (moyen) ou 3 (difficile)
  question       énoncé
  bonne_reponse  la seule bonne réponse
  pieges         trois mauvaises réponses séparées par « / »
  explication    texte affiché après la réponse
  actif          oui ou non

Erreurs bloquantes : colonnes manquantes, niveau invalide, question en double,
nombre de pièges différent de trois, piège égal à la bonne réponse.

Usage : python3 -I outils/chapitres_vers_js.py [dossier_chapitres] [questions-data.js]
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAP_COLS = ['id', 'matiere', 'numero', 'titre', 'fichier', 'actif']
Q_COLS = ['niveau', 'question', 'bonne_reponse', 'pieges', 'explication', 'actif']


def rows(path, cols, errors):
    lines = open(path, encoding='utf-8').read().splitlines()
    name = os.path.basename(path)
    if not lines or lines[0].split('\t') != cols:
        errors.append('%s : en-tête attendu « %s »' % (name, ' | '.join(cols)))
        return
    for n, line in enumerate(lines[1:], start=2):
        if not line.strip():
            continue
        cells = line.split('\t')
        if len(cells) != len(cols):
            errors.append('%s ligne %d : %d colonnes au lieu de %d' % (name, n, len(cells), len(cols)))
            continue
        r = dict(zip(cols, (c.strip() for c in cells)))
        if r['actif'] not in ('oui', 'non'):
            errors.append('%s ligne %d : actif doit valoir oui ou non' % (name, n))
        yield n, r


def main(folder, dst):
    errors, out, ids = [], [], set()
    for _, c in rows(os.path.join(folder, 'chapitres.tsv'), CHAP_COLS, errors):
        if c['actif'] != 'oui':
            continue
        if c['id'] in ids:
            errors.append('chapitres.tsv : id « %s » en double' % c['id'])
        ids.add(c['id'])
        questions, seen = [], set()
        for n, r in rows(os.path.join(folder, c['fichier']), Q_COLS, errors):
            if r['actif'] != 'oui':
                continue
            where = '%s ligne %d' % (c['fichier'], n)
            bad = [x.strip() for x in r['pieges'].split('/') if x.strip()]
            if r['niveau'] not in ('1', '2', '3'):
                errors.append(where + ' : niveau doit valoir 1, 2 ou 3')
            if not r['question'] or not r['bonne_reponse']:
                errors.append(where + ' : question ou bonne réponse vide')
            if r['question'] in seen:
                errors.append(where + ' : question en double')
            seen.add(r['question'])
            if len(bad) != 3:
                errors.append(where + ' : %d piège(s) au lieu de 3' % len(bad))
            if r['bonne_reponse'] in bad or len(set(bad)) != len(bad):
                errors.append(where + ' : réponse en double')
            questions.append({'d': int(r['niveau']) if r['niveau'].isdigit() else 1, 'q': r['question'],
                              'ok': r['bonne_reponse'], 'ko': bad, 'e': r['explication']})
        out.append({'id': c['id'], 'matiere': c['matiere'], 'numero': c['numero'], 'titre': c['titre'],
                    'questions': questions})
    if errors:
        for m in errors:
            print('ERREUR :', m)
        sys.exit('%d erreur(s) : questions-data.js n\'est pas modifié.' % len(errors))
    with open(dst, 'w', encoding='utf-8') as fo:
        fo.write('/* Questions du jeu, produites par outils/chapitres_vers_js.py à partir de chapitres/ :\n'
                 '   modifier les fichiers .tsv, pas ce fichier. */\n')
        fo.write('window.CHAPITRES = ')
        json.dump(out, fo, ensure_ascii=False, separators=(',', ':'))
        fo.write(';\n')
    for c in out:
        print('%s : %d questions' % (c['id'], len(c['questions'])))
    print('écrit dans', dst)


if __name__ == '__main__':
    folder = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'chapitres')
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'questions-data.js')
    main(folder, dst)
