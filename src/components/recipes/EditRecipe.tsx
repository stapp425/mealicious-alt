import { useContext, useEffect, useRef, useState } from "react"
import { useFirestoreGet, useFirestoreUpdate, useStorageDelete, useStorageUpload } from "@/util/hooks"
import { defaultRecipe, formatRecipe, type Recipe } from "@/util/types/recipe"
import { AppContext } from "@/App"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"
import { nanoid } from "nanoid"
import Title from "./Title"
import Description from "./Description"
import Ingredients from "./Ingredients"
import Instructions from "./Instructions"
import Diets from "./Diets"
import DishTypes from "./DishTypes"
import Times from "./Times"
import Image from "./Image"
import Nutrition from "./Nutrition"
import Container from "../theme/Container"
import Button from "../theme/Button"
import Spinner from "../theme/Spinner"
import { getImageNameFromFirebaseURL } from "@/util/types/app"

const EditRecipe: React.FC = () => {
  const { user } = useContext(AppContext)
  const { recipeId } = useParams()
  const { data } = useFirestoreGet<Recipe>("recipes", recipeId as string, formatRecipe, defaultRecipe)
  const [image, setImage] = useState<Image>({
    file: undefined,
    name: "",
    type: "",
    url: ""
  })
  const { updateFirestoreDoc } = useFirestoreUpdate()
  const { uploadFile } = useStorageUpload()
  const { deleteFile } = useStorageDelete()

  const { 
    register, 
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    control,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<Recipe>({ defaultValues: defaultRecipe })

  const originalImageURL = useRef<string>("")
  
  const submitRecipe: SubmitHandler<Recipe> = async(data: Recipe) => {
    if(user) {
      try {
        let imageRef

        if(image.file) {
          imageRef = await uploadFile(image.file, `${image.name}-${nanoid()}`)
          if(originalImageURL.current !== imageRef)
            await deleteFile(getImageNameFromFirebaseURL(originalImageURL.current))
        } else {
          imageRef = image.url
        }

        const editedRecipe = {
          ...data,
          image: imageRef,
          userId: user.uid
        }
  
        await updateFirestoreDoc("recipes", recipeId as string, editedRecipe)
        reset(data)
      } catch (err: any) {
        alert(err.message)
      }
    }
  }

  useEffect(() => {
    document.title = "Edit Recipe | Mealicious"
  }, [])

  useEffect(() => {
    if(data) {
      reset(data)
      setImage(i => ({
        ...i,
        url: data.image
      }))
      originalImageURL.current = data.image
    }
  }, [data])
  
  return (
    <Container.Form
      onSubmit={handleSubmit(submitRecipe)}
      className="grid grid-cols-1 xl:grid-rows-[repeat(6,fit-content)] xl:grid-cols-3 gap-3 p-3"
    >
      <Image
        name="image"
        register={register}
        error={errors}
        setValue={setValue}
        imageState={[image, setImage]}
        className="xl:row-span-2"
      />
      <Title 
        name="title"
        register={register}
        error={errors}
        className="xl:row-start-1 xl:col-start-2 xl:col-span-2"
      />
      <Times
        register={register}
        error={errors}
        className="xl:row-start-2 xl:col-start-2 xl:col-span-2"
      />
      <Description 
        name="description"
        register={register}
        error={errors}
        className="xl:row-start-3 xl:col-start-2 xl:col-span-2"
      />
      <Nutrition
        register={register}
        control={control}
        setError={setError}
        clearErrors={clearErrors}
        error={errors}
        setValue={setValue}
        className="xl:row-start-3 xl:row-span-2"
      />
      <Diets
        control={control}
        setValue={setValue}
        className="xl:row-start-4 xl:col-start-2"
      />
      <DishTypes
        control={control}
        setValue={setValue}
        className="xl:row-start-4 xl:col-start-3"
      />
      <Ingredients
        control={control}
        setValue={setValue}
        error={errors}
        setError={setError}
        clearErrors={clearErrors}
        className="xl:row-start-5 xl:col-start-2"
      />
      <Instructions
        control={control}
        setValue={setValue}
        error={errors}
        setError={setError}
        clearErrors={clearErrors}
        className="xl:row-start-5 xl:col-start-3"
      />
      <Button
        disabled={isSubmitting}
        type="submit" 
        className="h-fit text-xl disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {isSubmitting ? <><Spinner className="inline mr-2"/> Working on it...</> : "Update Recipe"}
      </Button>
    </Container.Form>    
  )
}

export default EditRecipe