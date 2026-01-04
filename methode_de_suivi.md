# 🎯 OBJECTIF GÉNÉRAL

Concevoir une **IU pédagogique intelligente** capable de :

* détecter des **signaux de troubles de l’apprentissage** (sans poser de diagnostic médical),
* identifier les **forces cognitives** de chaque élève,
* adapter dynamiquement les contenus, aides et évaluations,
* valoriser la progression et le raisonnement plutôt que la simple réussite.

---

# 🧠 PRINCIPES FONDATEURS

1. **L’évaluation est un outil d’observation**, pas uniquement de notation.
2. Toute difficulté est interprétée comme un **signal cognitif**, jamais comme une faute.
3. Chaque élève possède **au moins une force dominante** à exploiter pédagogiquement.
4. Les données collectées servent à **adapter l’apprentissage**, pas à classer.

---

# 🧩 ARCHITECTURE LOGIQUE À IMPLÉMENTER

## 1️⃣ ÉVALUATION DIAGNOSTIQUE INITIALE

### Objectif

Créer un **profil cognitif initial** de l’élève.

### Contraintes

* Durée courte : **15 à 20 items**
* Évaluation **non notée**
* Multi-formats obligatoires

### Types d’items à inclure

* QCM simples
* Raisonnement logique sans calcul
* Compréhension de consigne
* Lecture / interprétation
* Question avec aide progressive
* Auto-correction guidée

---

## 2️⃣ DONNÉES À COLLECTER (OBLIGATOIRES)

Pour chaque question :

```json
{
  "question_id": "...",
  "reponse": "...",
  "correct": true|false,
  "temps_reponse_ms": 12345,
  "tentatives": 1,
  "aide_utilisee": true|false,
  "type_competence": "lecture | logique | calcul | comprehension | attention"
}
```

---

## 3️⃣ INDICATEURS COGNITIFS À CALCULER

### Quantitatifs

* Temps moyen par type de compétence
* Variabilité du temps de réponse
* Taux de réussite par type
* Évolution dans la session (fatigue)

### Qualitatifs

* Erreurs systématiques vs aléatoires
* Réussite après aide
* Écart entre raisonnement et réponse finale
* Décalage oral / écrit (si applicable)

---

## 4️⃣ LOGIQUE D’INFÉRENCE (SANS DIAGNOSTIC)

L’agent IA doit **formuler des hypothèses pédagogiques**, jamais médicales.

### Exemples d’hypothèses

* Difficulté de décodage écrit
* Surcharge de la mémoire de travail
* Impulsivité attentionnelle
* Rigidité cognitive
* Raisonnement logique fort mais transcription faible
* Ennui / sous-stimulation

### Format de sortie attendu

```json
{
  "fragilites_probables": ["lecture", "attention"],
  "forces_identifiees": ["raisonnement_logique", "intuition"],
  "niveau_confiance": "faible | moyen | élevé"
}
```

---

## 5️⃣ DÉTECTION DES FORCES (PRIORITAIRE)

L’agent doit explicitement chercher et mettre en avant :

* rapidité de compréhension
* qualité du raisonnement même en cas d’erreur
* capacité d’auto-correction
* transfert de concepts
* persévérance

⚠️ Une IU ne peut **jamais afficher uniquement des faiblesses**.

---

## 6️⃣ ADAPTATION PÉDAGOGIQUE AUTOMATIQUE

### Règles simples à implémenter

```text
Si erreur + temps long → proposer aide structurée
Si erreur + temps court → proposer question réflexive
Si réussite rapide → proposer défi plus complexe
Si échec répété → changer de format (visuel / guidé)
```

### Types d’aides

* reformulation de consigne
* décomposition en étapes
* indice progressif
* exemple analogue
* question métacognitive (“comment as-tu raisonné ?”)

---

## 7️⃣ FEEDBACK À L’ÉLÈVE (OBLIGATOIRE)

Le feedback doit :

* valoriser le raisonnement
* expliquer l’erreur
* proposer une stratégie alternative
* éviter toute formulation culpabilisante

### Exemple

> “Ton raisonnement est cohérent. L’erreur vient de la dernière étape. Essayons une autre méthode.”

---

## 8️⃣ PROFIL ÉLÈVE SYNTHÉTIQUE (VISIBLE IU)

```json
{
  "profil_cognitif": {
    "forces": ["logique", "compréhension orale"],
    "zones_a_travailler": ["lecture écrite"],
    "style_apprentissage": "visuel / logique / guidé"
  },
  "recommandations": [
    "Privilégier les supports visuels",
    "Alléger les consignes écrites",
    "Encourager l’explication orale"
  ]
}
```

---

## 9️⃣ ÉVOLUTION DANS LE TEMPS

* Le profil doit être **révisable automatiquement**
* Les nouvelles évaluations **pondèrent** les anciennes
* Les progrès sont mis en avant dans l’IU

---

# 🛑 INTERDITIONS EXPLICITES

❌ Pas de notation punitive

---

# ✅ OBJECTIF intégré DE L’IU

Créer une expérience où :

* l’élève se sent **compris**
* l’erreur devient **une information**
* les forces deviennent des **leviers pédagogiques**
* l’IA agit comme un **enseignant adaptatif bienveillant**


