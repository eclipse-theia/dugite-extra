/**
 * An email address associated with a GitHub account.
 */
export interface Email {

    readonly email: string

    /**
     * Represents whether GitHub has confirmed the user has access to this
     * email address.
     */
    readonly verified: boolean

    /**
     * Flag for the user's preferred email address. Other email addresses
     * are provided for associating commit authors with the one GitHub account.
     */
    readonly primary: boolean
}