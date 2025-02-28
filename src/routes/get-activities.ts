import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";


export async function getActivities(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            }),
        }
    } ,async (request) => {
        const { tripId } = request.params;

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { 
                Activity: {
                    orderBy: {
                        occours_at: "asc",
                    }
                }
             }
        })

        if(!trip){
            throw new ClientError('Trip not found')
        }

        const differenceBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(dayjs(trip.starts_at), 'days')

        const activities = Array.from({ length: differenceBetweenTripStartAndEnd + 1 }).map((_, index) => {
            const date = dayjs(trip.starts_at).add(index, 'days')

            return {
                date: date.toDate(),
                activities: trip.Activity.filter(activity => {
                    return dayjs(activity.occours_at).isSame(date, 'day')
                })
            }

        })
            


        return { activities }
    })
}
