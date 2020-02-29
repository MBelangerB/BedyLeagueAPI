# BedyLeagueAPI
Cette API servira de PONT de communication entre les ChatBot *(NightBot, StreamLabs ChatBot, StreamLabs CloudBot, etc.)* et API de Riot Games pour **League Of Legend**. Ils pourront ainsi permettre au utilisateur d'obtenir différentes informations sur l'invocateur. 

# Listes des commandes disponibles
| Commandes| Description | Exemple de retour 
|--|--|--|
| /rank  | Permet d'obtenir le rang de invocateur  | GOLD IV (100 LP) [✓--]
| /rotate  | Permet d'obtenir la rotation actuel  | 
| /livegame  | Permet d'obtenir les informations sur les invocateurs/champion de la partie actuel | 
| /topMasteries  | Permet d'obtenir les 5 champions avec le plus de points de maitrises | 

# Utilisation des commandes
## Rank
Cette commande permet d'obtenir le rang de l'invocateur.
### Paramètres

| Paramètres| Obligatoire|Description|Valeur disponible| Exemple
|--|--|--|--|--|
| region  | Oui|Le serveur|NA1, EUW1|/rank?**region=NA1**
| summonerName| Oui | Le nom de l'invocateur|| /rank?region=NA1&**summonerName=Bedy90**
|||||
|WinRate|Non|Afficher le % victoires|0 ou 1||
|lp|Non|Afficher ou non les  LP|0 ou 1|/rank?region=NA1&summonerName=Bedy90?**lp=0**|
|series|Non|Caractères de remplacer pour les Wins/Losses/Not Play||/rank?region=NA1&summonerName=Bedy90?series=abc|
|queueType|Non|Définir la queue pour laquel on désire obtenir le rang|(solo5, tft)|/rank?region=NA1&summonerName=Bedy90?**queueType=tft**|


## Rotate
Cette commande permet d'obtenir la rotation actuel.
### Paramètres

| Paramètres| Obligatoire|Description|Valeur disponible| Exemple
|--|--|--|--|--|
| region  | Oui|Le serveur|NA1, EUW1|/rank?**region=NA1**


## livegame
Permet d'obtenir les informations sur les invocateurs/champion de la partie actuel
### Paramètres

| Paramètres| Obligatoire|Description|Valeur disponible| Exemple
|--|--|--|--|--|
| region  | Oui|Le serveur|NA1, EUW1|/rank?**region=NA1**
| summonerName| Oui | Le nom de l'invocateur|| /rank?region=NA1&**summonerName=Bedy90**


## topMasteries
Permet d'obtenir les 5 champions avec le plus de points de maitrises 
### Paramètres

| Paramètres| Obligatoire|Description|Valeur disponible| Exemple
|--|--|--|--|--|
| region  | Oui|Le serveur|NA1, EUW1|/rank?**region=NA1**
| summonerName| Oui | Le nom de l'invocateur|| /rank?region=NA1&**summonerName=Bedy90**
|||||
|nb|Non|Nombre de données a afficher (5 par défaut)|||