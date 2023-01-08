export interface IApiParameters {
    /*
    json :
        Default: False
        Response is return JSON object
    series :
        Default: '✓X-'
        Specifie les valeur a utilisé en BO.
    nb  :
        Default: 5
        Method : Masteries

    lp  :
        Default : True
        Method : Ranked
        Afficher le nombre de LP dans la chaine de retour
    type
        Default : True
        Method : Ranked
        Afficher le type de queue
    winrate
        Default : True
        Method : Ranked
        Afficher le WinRate
    all
        Default : False
        Method : Ranked
        Afficher les informations de toutes les Queues disponible
    queuetype
        Default : True
        Method : Ranked
        Afficher le nom de la queue dans la réponse
    fq
        Default : False
        Method : Ranked
    series
        Default : '✓X-'
        Method : Ranked
        Symbole de remplacement pour Win/Lose/Not play
    fullstring
        Default : False
        Method : Ranked
        Afficher le nom de l'invocateur dans la réponse
*/

    // Valid for all method
    json: boolean;
    // Valid for masteries method
    nbMasteries: number;

    // VAlid for rank method
    series: string[3];


    /**
     * Affiche le nombre de LP
     */
    showLp: boolean;
    /**
     * Affiche le WinRate
     */
    showWinRate: boolean;
    /**
     * Affiche le nom de la queue dans le retour
     */
    showQueueType: boolean;
    /**
     * Retourne l'information sur toutes les queues (LoL)
     */
    showAllQueueInfo: boolean;
    /**
     * Affiche le summonername dans le retour
     */
    showFullString: boolean;
    /**
     * Queue qu'on désire affiche (solo5, flex)
     */
    queueType: string;

    /**
     * In answer, replace «SoloQ» by « SoloQ/DuoQ »
     */
    showFQ: boolean;

}

export class ApiParameters implements IApiParameters {
    json = false;
    nbMasteries = 5;
    series = '✓X-';
    showLp = true;
    showWinRate = true;
    showQueueType = true;
    showAllQueueInfo = false;
    showFullString = false;
    queueType = 'solo5';
    showFQ = false;

}